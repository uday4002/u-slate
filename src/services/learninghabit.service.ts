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

// Recalculate streak, XP, and longest streak for a habit
export const recalculateHabitMetrics = (habit: ILearningHabit): void => {
    if ((!habit.progress || habit.progress.length === 0) &&
        (!habit.freezes || habit.freezes.length === 0)) {
        habit.streak = 0;
        habit.xp = 0;
        habit.longestStreak = habit.longestStreak ?? 0;
        return;
    }

    const countsByDate = new Map<string, number>();

    if (habit.progress) {
        habit.progress.forEach((p) => {
            const key = normalizeDateToUTC(p.date).toISODate()!;
            const current = countsByDate.get(key) ?? 0;
            countsByDate.set(key, current + (p.count ?? 0));
        });
    }

    const completedDaysSet = new Set<string>();
    const target = habit.target ?? 1;
    for (const [key, sum] of countsByDate.entries()) {
        if (sum >= target) completedDaysSet.add(key);
    }

    const frozenDaysSet = new Set<string>();
    if (habit.freezes) {
        habit.freezes.forEach((f: IFreezeDay | Date) => {
            const freezeDate = "date" in f ? f.date : f;
            frozenDaysSet.add(normalizeDateToUTC(freezeDate).toISODate()!);
        });
    }

    const todayUserMidnightUtc = DateTime.now()
        .setZone(USER_TIMEZONE)
        .startOf("day")
        .toUTC();

    let streak = 0;
    let currentDay = todayUserMidnightUtc;

    while (true) {
        const key = currentDay.toISODate()!;
        if (completedDaysSet.has(key)) {
            streak++;
            currentDay = currentDay.minus({ days: 1 });
        } else if (frozenDaysSet.has(key)) {
            currentDay = currentDay.minus({ days: 1 });
        } else {
            break;
        }
    }

    const baseXp = completedDaysSet.size * 10;
    const streakBonus = streak * 2;
    const totalXp = baseXp + streakBonus;

    habit.streak = streak;
    habit.xp = totalXp;
    habit.longestStreak = Math.max(habit.longestStreak ?? 0, streak);
};

// Recalculate all habits at midnight IST (called by Vercel Cron)
export async function recalcAllHabitsAtMidnight() {
    const habits = await LearningHabitModel.find({});
    for (const habit of habits) {
        recalculateHabitMetrics(habit);
        await habit.save();
    }
}

// Create a new habit
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
    return await LearningHabitModel.find({ user: userId }) as ILearningHabit[];
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

    const isFrozen = habit.freezes.some((f: IFreezeDay | Date) => {
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

    const normalizedDate = normalizeDateToUTC(date).toISODate();
    habit.progress = habit.progress.filter(
        (p: ILearningProgress) => normalizeDateToUTC(p.date).toISODate() !== normalizedDate
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
    const exists = habit.freezes.some((f: IFreezeDay | Date) => {
        const fDate = "date" in f ? f.date : f;
        return normalizeDateToUTC(fDate).toISODate() === normalizedDate;
    });

    if (exists) return null;

    habit.freezes.push({ date: normalizeDateToUTC(freezeDate).toJSDate() } as IFreezeDay);

    recalculateHabitMetrics(habit);
    await habit.save();
    return habit;
};
