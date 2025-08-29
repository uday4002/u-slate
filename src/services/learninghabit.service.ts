import LearningHabitModel, { ILearningHabit, ILearningProgress, Frequency, IFreezeDay } from "@/server/models/LearningHabit";
import { HydratedDocument, Types } from "mongoose";

// Type for a full Mongoose habit document
export type LearningHabitDocument = HydratedDocument<ILearningHabit>;

// Utility Date Helpers
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

// Calculates the start of the ISO week (Monday).
const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // ISO week starts on Monday, which is 1. Sunday is 0.
    const diff = day === 0 ? 6 : day - 1;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - diff);
    return d;
};

// Calculates the end of the ISO week (Sunday).
const getWeekEnd = (date: Date) => {
    const d = getWeekStart(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

// Sums progress for a given date range.
const sumInRange = (entries: ILearningProgress[], from: Date, to: Date) =>
    entries.reduce((acc, p) => {
        const entryDate = new Date(p.date);
        return (entryDate >= from && entryDate <= to) ? acc + (p.count || 0) : acc;
    }, 0);

// Checks if two dates fall on the same calendar day.
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Checks if two dates fall on the same calendar week (Monday-Sunday).
function isSameWeek(a: Date, b: Date) {
    return getWeekStart(a).getTime() === getWeekStart(b).getTime();
}

// Freeze Helpers
export const canFreeze = (h: ILearningHabit, date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const freezesThisMonth = (h.freezes || []).filter(
        (f: IFreezeDay) => new Date(f.date).getFullYear() === year && new Date(f.date).getMonth() === month
    );
    return freezesThisMonth.length < 2;
};

// Core Stat Calculations
// Returns the correct date window based on the habit's frequency.
export const computeWindow = (h: ILearningHabit) => {
    if (h.frequency === "weekly") {
        const from = getWeekStart(new Date());
        const to = getWeekEnd(new Date());
        return { from, to };
    }
    const from = startOfToday();
    const to = endOfToday();
    return { from, to };
};

// Computes the progress percentage for a habit within its time window.
export const computeProgressPercent = (h: ILearningHabit) => {
    const { from, to } = computeWindow(h);
    const done = sumInRange(h.progress || [], from, to);
    if (!h.target || h.target <= 0) return 0;
    return Math.max(0, Math.min(100, (done / h.target) * 100));
};

// Updates the streak and longest streak, handling both daily and weekly logic.
export const updateStreak = (h: ILearningHabit) => {
    let streak = 0;
    const today = new Date();

    // Sort all completed and frozen days chronologically
    const allCompletedDates = [...h.progress.filter(p => (p.count || 0) >= h.target).map(p => new Date(p.date)), ...h.freezes.map(f => new Date(f.date))]
        .sort((a, b) => a.getTime() - b.getTime());

    if (h.frequency === 'daily') {
        let currentStreak = 0;
        let lastDate: Date | null = null;
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (const date of allCompletedDates) {
            if (!lastDate) {
                currentStreak = 1;
            } else {
                const diff = date.getTime() - lastDate.getTime();
                // Check if the current date is exactly one day after the last one (plus a small buffer)
                if (diff > 0 && diff <= oneDayMs + 1000) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            streak = Math.max(streak, currentStreak);
            lastDate = date;
        }

    } else { // weekly frequency
        let currentStreak = 0;
        let lastWeekStart: Date | null = null;

        // Group progress by week and check if the target was met
        const completedWeeks = new Set<string>();
        const weeklyProgress: { [key: string]: number } = {};
        h.progress.forEach(p => {
            const weekStart = getWeekStart(new Date(p.date)).toISOString();
            weeklyProgress[weekStart] = (weeklyProgress[weekStart] || 0) + (p.count || 0);
        });

        for (const weekStart in weeklyProgress) {
            if (weeklyProgress[weekStart] >= h.target) {
                completedWeeks.add(weekStart);
            }
        }

        // Add frozen weeks (if they were daily and now it's weekly) to the completed weeks set
        h.freezes.forEach(f => completedWeeks.add(getWeekStart(new Date(f.date)).toISOString()));

        const sortedWeeks = Array.from(completedWeeks).sort();

        for (const week of sortedWeeks) {
            const currentWeekDate = new Date(week);

            if (!lastWeekStart) {
                currentStreak = 1;
            } else {
                const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
                // Check if the current week starts exactly one week after the last one
                if (currentWeekDate.getTime() - lastWeekStart.getTime() <= oneWeekMs + 1000) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            streak = Math.max(streak, currentStreak);
            lastWeekStart = currentWeekDate;
        }
    }

    return { streak, longestStreak: Math.max(h.longestStreak, streak) };
};

// Awards XP based on completing the daily/weekly window.
export const awardXp = (h: ILearningHabit, justCompletedWindow: boolean) => {
    let xp = h.xp || 0;
    if (justCompletedWindow) {
        xp += 10 + Math.min(50, (h.streak || 0) * 2);
    }
    return xp;
};

// CREATE HABIT
export const createLearningHabit = async (
    data: {
        title: string;
        category?: string;
        frequency: Frequency;
        target: number;
        user: string;
    }
): Promise<LearningHabitDocument> => {
    const habit = new LearningHabitModel({
        ...data,
        progress: [],
        freezes: [],
        streak: 0,
        longestStreak: 0,
        xp: 0,
    });
    return await habit.save();
};

// GET ALL HABITS FOR A USER
export const getLearningHabitsByUser = async (
    userId: string
): Promise<LearningHabitDocument[]> => {
    return await LearningHabitModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
};

// UPDATE HABIT
export const updateLearningHabit = async (
    id: string,
    userId: string | Types.ObjectId,
    patch: Partial<ILearningHabit>
): Promise<LearningHabitDocument | null> => {
    return await LearningHabitModel.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: patch },
        { new: true }
    ).exec();
};

// DELETE HABIT
export const deleteLearningHabit = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<LearningHabitDocument | null> => {
    return await LearningHabitModel.findOneAndDelete({ _id: id, user: userId }).exec();
};

// ADD PROGRESS (corrected to use atomic updates)
export const addHabitProgress = async (
    id: string,
    userId: string | Types.ObjectId,
    progress: { date: string | Date; count: number }
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: id, user: userId }).exec();
    if (!habit) return null;

    const { from, to } = computeWindow(habit);
    const oldProgressTotal = sumInRange(habit.progress, from, to);

    // Calculate progress for the current update
    let newProgressTotal = 0;
    if (habit.frequency === 'daily') {
        const existingDailyProgress = habit.progress.find((p: ILearningProgress) => isSameDay(new Date(p.date), new Date(progress.date)));
        newProgressTotal = (existingDailyProgress ? existingDailyProgress.count : 0) + progress.count;
    } else {
        newProgressTotal = oldProgressTotal + progress.count;
    }

    const justCompleted = newProgressTotal >= habit.target && oldProgressTotal < habit.target;

    const xpToAdd = justCompleted ? (10 + Math.min(50, (habit.streak || 0) * 2)) : 0;
    const progressDate = new Date(progress.date);

    // Find the existing progress entry for update
    const existingProgressIndex = habit.progress.findIndex((p: ILearningProgress) =>
        (habit.frequency === 'daily' && isSameDay(new Date(p.date), progressDate)) ||
        (habit.frequency === 'weekly' && isSameWeek(new Date(p.date), progressDate))
    );

    let updatedHabit;

    if (existingProgressIndex !== -1) {
        // Update an existing progress entry using $set
        const updatePath = `progress.${existingProgressIndex}.count`;
        updatedHabit = await LearningHabitModel.findOneAndUpdate(
            { _id: id, user: userId },
            {
                $set: { [updatePath]: newProgressTotal },
                $inc: { xp: xpToAdd }
            },
            { new: true }
        );
    } else {
        // Push a new progress entry using $push
        updatedHabit = await LearningHabitModel.findOneAndUpdate(
            { _id: id, user: userId },
            {
                $push: { progress: { date: progressDate, count: progress.count } },
                $inc: { xp: xpToAdd }
            },
            { new: true }
        );
    }

    // Recalculate streak and longest streak after the atomic update
    if (updatedHabit) {
        const { streak, longestStreak } = updateStreak(updatedHabit);
        updatedHabit.streak = streak;
        updatedHabit.longestStreak = longestStreak;
        await updatedHabit.save();
    }

    return updatedHabit;
};

// ADD FREEZE (corrected to be more robust)
export const addFreeze = async (
    habitId: string,
    userId: string | Types.ObjectId,
    date: Date
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId }).exec();
    if (!habit || habit.frequency !== 'daily' || !canFreeze(habit, date)) {
        return null;
    }

    const updatedHabit = await LearningHabitModel.findOneAndUpdate(
        { _id: habitId, user: userId },
        { $push: { freezes: { date } } },
        { new: true }
    );

    if (updatedHabit) {
        const { streak, longestStreak } = updateStreak(updatedHabit);
        updatedHabit.streak = streak;
        updatedHabit.longestStreak = longestStreak;
        await updatedHabit.save();
    }

    return updatedHabit;
};