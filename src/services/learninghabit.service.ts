import { DateTime } from "luxon";
import LearningHabitModel, {
    ILearningHabit,
    ILearningProgress,
    IFreezeDay,
} from "@/server/models/LearningHabit";
import { Document } from "mongoose";

const USER_TIMEZONE = "Asia/Kolkata";

// Normalize any date to UTC based on USER_TIMEZONE midnight
const normalizeDateToUTC = (date: Date | string | DateTime): DateTime => {
    return DateTime.fromJSDate(
        date instanceof DateTime ? date.toJSDate() : new Date(date),
        { zone: USER_TIMEZONE }
    )
        .startOf("day")
        .toUTC();
};


export const recalculateHabitMetrics = (habit: ILearningHabit): void => {
    if (!habit || !Array.isArray(habit.progress)) return;

    // Sort progress by date ascending
    const sortedProgress = [...habit.progress].sort((a, b) => {
        return normalizeDateToUTC(a.date).toMillis() - normalizeDateToUTC(b.date).toMillis();
    });

    // Prepare freeze dates (ISO strings)
    const freezeDates = new Set((habit.freezes || []).map(f => normalizeDateToUTC(f.date).toISODate()));

    let longestStreak = 0;
    let xp = 0;

    // Calculate current streak up to today (or last progress date)
    let currentStreak = 0;
    let streak = 0;
    let lastDate: DateTime | null = null;

    for (let i = 0; i < sortedProgress.length; i++) {
        const entry = sortedProgress[i];
        const entryDate = normalizeDateToUTC(entry.date);
        const entryIso = entryDate.toISODate();

        // Only count progress if not frozen and meets target
        if (freezeDates.has(entryIso) || entry.count < habit.target) {
            streak = 0;
            lastDate = entryDate;
            continue;
        }

        if (lastDate) {
            let expected = habit.frequency === "weekly"
                ? lastDate.plus({ weeks: 1 })
                : lastDate.plus({ days: 1 });
            let gap = habit.frequency === "weekly"
                ? entryDate.diff(expected, "weeks").weeks
                : entryDate.diff(expected, "days").days;
            if (gap > 0) {
                // Check if all gap days are frozen
                let allFrozen = true;
                for (let j = 1; j <= gap; j++) {
                    const gapDate = habit.frequency === "weekly"
                        ? expected.plus({ weeks: j - 1 })
                        : expected.plus({ days: j - 1 });
                    if (!freezeDates.has(gapDate.toISODate())) {
                        allFrozen = false;
                        break;
                    }
                }
                if (!allFrozen) {
                    streak = 0;
                }
            }
        }
        streak += 1;
        if (streak > longestStreak) longestStreak = streak;
        lastDate = entryDate;
        // XP: 10 per streak day, 1 per count above target
        xp += 10 + Math.max(0, entry.count - habit.target);
    }

    // Now, calculate current streak up to today (or last progress date)
    // If the last progress entry is today (or this week), streak is currentStreak
    if (sortedProgress.length > 0) {
        let today = DateTime.now().setZone(USER_TIMEZONE).startOf("day").toUTC();
        let lastProgressDate = normalizeDateToUTC(sortedProgress[sortedProgress.length - 1].date);
        let isCurrent = false;
        if (habit.frequency === "daily") {
            isCurrent = lastProgressDate.toISODate() === today.toISODate();
        } else {
            // For weekly, check if last progress is in the same week as today
            isCurrent = lastProgressDate.hasSame(today, "week");
        }
        currentStreak = isCurrent ? streak : 0;
    } else {
        currentStreak = 0;
    }

    habit.streak = currentStreak;
    habit.longestStreak = longestStreak;
    habit.xp = xp;
};


export async function recalcAllHabitsAtMidnight() {
    const habits = await LearningHabitModel.find({});
    for (const habit of habits) {
        recalculateHabitMetrics(habit);
        await habit.save();
    }
}

export const createLearningHabit = async (
    habitData: Partial<ILearningHabit>
): Promise<ILearningHabit> => {
    const newHabit = new LearningHabitModel(habitData);
    await newHabit.save();
    return newHabit;
};

// Get habits for a user 
export const getLearningHabitsByUser = async (
    userId: string
): Promise<ILearningHabit[]> => {
    return (await LearningHabitModel.find({ user: userId })) as ILearningHabit[];
};

// Update habit
export const updateLearningHabit = async (
    habitId: string,
    userId: string,
    updateData: Partial<ILearningHabit>
): Promise<ILearningHabit | null> => {
    return await LearningHabitModel.findOneAndUpdate(
        { _id: habitId, user: userId },
        { $set: updateData },
        { new: true }
    );
};

// Delete habit
export const deleteLearningHabit = async (
    habitId: string,
    userId: string
): Promise<Document<ILearningHabit> | null> => {
    return await LearningHabitModel.findOneAndDelete({ _id: habitId, user: userId });
};

// Add progress to a habit
export const addHabitProgress = async (
    habitId: string,
    userId: string,
    progressEntry: Omit<ILearningProgress, "date"> & { date: Date }
): Promise<ILearningHabit | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId });
    if (!habit) return null;

    const normalizedDate = normalizeDateToUTC(progressEntry.date);

    const isFrozen = (habit.freezes || []).some((f: IFreezeDay | Date) => {
        const freezeDate = "date" in f ? f.date : f;
        return normalizeDateToUTC(freezeDate).toISODate() === normalizedDate.toISODate();
    });

    if (isFrozen) throw new Error("Cannot add progress on a frozen day.");

    const existingProgress = habit.progress.find(
        (p: ILearningProgress) =>
            normalizeDateToUTC(p.date).toISODate() === normalizedDate.toISODate()
    );

    if (existingProgress) {
        existingProgress.count += progressEntry.count;
    } else {
        habit.progress.push({
            ...progressEntry,
            date: normalizedDate.toJSDate(),
        } as ILearningProgress);
    }

    recalculateHabitMetrics(habit);
    await habit.save();
    return habit;
};


// Add a freeze day
export const addFreeze = async (
    habitId: string,
    userId: string,
    freezeDate: Date
): Promise<ILearningHabit | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId });
    if (!habit) return null;

    const normalizedDate = normalizeDateToUTC(freezeDate).toISODate();
    const exists = (habit.freezes || []).some((f: IFreezeDay | Date) => {
        const fDate = "date" in f ? f.date : f;
        return normalizeDateToUTC(fDate as Date).toISODate() === normalizedDate;
    });

    if (exists) return null;

    habit.freezes = habit.freezes || [];
    habit.freezes.push({ date: normalizeDateToUTC(freezeDate).toJSDate() } as IFreezeDay);

    recalculateHabitMetrics(habit);
    await habit.save();
    return habit;
};
