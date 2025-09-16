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
    const countsByDate = new Map<string, number>();
    if (Array.isArray(habit.progress)) {
        for (const p of habit.progress) {
            if (!p || !p.date) continue;
            const key = normalizeDateToUTC(p.date).toISODate()!;
            const current = countsByDate.get(key) ?? 0;
            countsByDate.set(key, current + (p.count ?? 0));
        }
    }

    const target = Math.max(1, habit.target ?? 1);

    const completedDaysSet = new Set<string>();
    for (const [k, sum] of countsByDate.entries()) {
        if (sum >= target) completedDaysSet.add(k);
    }

    const frozenDaysSet = new Set<string>();
    if (Array.isArray(habit.freezes)) {
        for (const f of habit.freezes) {
            const freezeDate = ("date" in (f as IFreezeDay) ? (f as IFreezeDay).date : f) as Date;
            if (!freezeDate) continue;
            frozenDaysSet.add(normalizeDateToUTC(freezeDate).toISODate()!);
        }
    }

    const todayUserMidnightUtc = DateTime.now()
        .setZone(USER_TIMEZONE)
        .startOf("day")
        .toUTC();

    const unionDates: DateTime[] = Array.from(new Set([...completedDaysSet, ...frozenDaysSet]))
        .map((iso) => DateTime.fromISO(iso, { zone: "utc" }).startOf("day"));

    const relevantPastDates = unionDates
        .filter((d) => d <= todayUserMidnightUtc)
        .sort((a, b) => a.toMillis() - b.toMillis());

    let streak = 0;

    if (relevantPastDates.length > 0) {
        let currentDay = relevantPastDates[relevantPastDates.length - 1];

        while (true) {
            const key = currentDay.toISODate()!;
            if (completedDaysSet.has(key)) {
                streak += 1;
                currentDay = currentDay.minus({ days: 1 });
                continue;
            } else if (frozenDaysSet.has(key)) {
                currentDay = currentDay.minus({ days: 1 });
                continue;
            } else {
                break;
            }
        }
    } else {
        streak = 0;
    }

    const sortedRelevantDates = Array.from(new Set([...completedDaysSet, ...frozenDaysSet]))
        .map((iso) => DateTime.fromISO(iso, { zone: "utc" }).startOf("day"))
        .sort((a, b) => a.toMillis() - b.toMillis());

    let longestStreak = 0;
    let currentCompletedRun = 0;
    let lastDate: DateTime | null = null;

    for (const dt of sortedRelevantDates) {
        if (lastDate) {
            const diff = dt.diff(lastDate, "days").days;
            if (diff > 1) {
                currentCompletedRun = 0;
            }
        }

        const key = dt.toISODate()!;
        if (completedDaysSet.has(key)) {
            currentCompletedRun += 1;
            if (currentCompletedRun > longestStreak) longestStreak = currentCompletedRun;
        }

        lastDate = dt;
    }

    const baseXp = completedDaysSet.size * 10;
    const streakBonus = streak * 2;
    const totalXp = baseXp + streakBonus;

    habit.streak = streak;
    habit.longestStreak = longestStreak;
    habit.xp = totalXp;
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

// Remove progress from a habit
export const removeHabitProgress = async (
    habitId: string,
    userId: string,
    date: Date
): Promise<ILearningHabit | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId });
    if (!habit) return null;

    const normalizedDateIso = normalizeDateToUTC(date).toISODate();
    habit.progress = habit.progress.filter(
        (p: ILearningProgress) => normalizeDateToUTC(p.date).toISODate() !== normalizedDateIso
    );

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
