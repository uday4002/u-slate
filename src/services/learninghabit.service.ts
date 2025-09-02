/* src/services/learninghabit.service.ts */

import LearningHabitModel, { ILearningHabit, ILearningProgress, Frequency, IFreezeDay } from "@/server/models/LearningHabit";
import { HydratedDocument, Types } from "mongoose";

export type LearningHabitDocument = HydratedDocument<ILearningHabit>;

// Utility Date Helpers
const startOf = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const endOf = (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };

// Calculates the start of the ISO week (Monday).
const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
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
export const computeWindow = (h: ILearningHabit) => {
    if (h.frequency === "weekly") {
        const from = getWeekStart(new Date());
        const to = getWeekEnd(new Date());
        return { from, to };
    }
    const today = new Date();
    const from = startOf(today);
    const to = endOf(today);
    return { from, to };
};

export const computeProgressPercent = (h: ILearningHabit) => {
    const { from, to } = computeWindow(h);
    const done = sumInRange(h.progress || [], from, to);
    if (!h.target || h.target <= 0) return 0;
    return Math.max(0, Math.min(100, (done / h.target) * 100));
};

// UPDATED AND FIXED: Updates the streak and longest streak, handling both daily and weekly logic.
export const updateStreak = (h: ILearningHabit) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let longestStreak = h.longestStreak;

    const completedOrFrozenDates = [
        ...h.progress.filter(p => (p.count || 0) >= h.target).map(p => new Date(p.date)),
        ...h.freezes.map(f => new Date(f.date))
    ].sort((a, b) => a.getTime() - b.getTime());

    if (h.frequency === 'daily') {
        if (completedOrFrozenDates.length === 0) {
            longestStreak = Math.max(longestStreak, 0);
            return { streak: 0, longestStreak };
        }

        let lastDate = completedOrFrozenDates[completedOrFrozenDates.length - 1];

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const isLastActivityToday = isSameDay(lastDate, today);
        const isLastActivityYesterday = isSameDay(lastDate, yesterday);

        if (!isLastActivityToday && !isLastActivityYesterday) {
            longestStreak = Math.max(longestStreak, 0);
            return { streak: 0, longestStreak };
        }

        currentStreak = isLastActivityToday ? 1 : 0;

        for (let i = completedOrFrozenDates.length - 2; i >= 0; i--) {
            const currentDate = completedOrFrozenDates[i];
            const nextDate = completedOrFrozenDates[i + 1];

            const oneDayInMs = 24 * 60 * 60 * 1000;
            if (nextDate.getTime() - currentDate.getTime() <= oneDayInMs + 1000) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else { // weekly frequency
        const weeklyProgress: { [key: string]: number } = {};
        h.progress.forEach(p => {
            const weekStart = getWeekStart(new Date(p.date)).toISOString();
            weeklyProgress[weekStart] = (weeklyProgress[weekStart] || 0) + (p.count || 0);
        });

        const completedWeeks = new Set<string>();
        for (const weekStart in weeklyProgress) {
            if (weeklyProgress[weekStart] >= h.target) {
                completedWeeks.add(weekStart);
            }
        }
        h.freezes.forEach(f => completedWeeks.add(getWeekStart(new Date(f.date)).toISOString()));
        const sortedWeeks = Array.from(completedWeeks).sort();

        if (sortedWeeks.length === 0) {
            return { streak: 0, longestStreak };
        }

        let lastWeekStart = new Date(sortedWeeks[sortedWeeks.length - 1]);
        const thisWeekStart = getWeekStart(today);
        const lastWeekStartCalc = new Date(thisWeekStart);
        lastWeekStartCalc.setDate(thisWeekStart.getDate() - 7);

        const isLastActivityThisWeek = isSameWeek(lastWeekStart, today);
        const isLastActivityLastWeek = isSameWeek(lastWeekStart, lastWeekStartCalc);

        if (!isLastActivityThisWeek && !isLastActivityLastWeek) {
            return { streak: 0, longestStreak };
        }

        currentStreak = isLastActivityThisWeek ? 1 : 0;

        for (let i = sortedWeeks.length - 2; i >= 0; i--) {
            const currentWeekDate = new Date(sortedWeeks[i]);
            const nextWeekDate = new Date(sortedWeeks[i + 1]);
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

            if (nextWeekDate.getTime() - currentWeekDate.getTime() <= oneWeekInMs + 1000) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    return { streak: currentStreak, longestStreak };
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

// Add or update progress for a habit
export const addHabitProgress = async (
    id: string,
    userId: string | Types.ObjectId,
    progress: { date: Date; count: number }
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: id, user: userId }).exec();
    if (!habit) {
        return null;
    }

    const { from, to } = computeWindow(habit);
    const oldProgressTotal = sumInRange(habit.progress, from, to);
    const progressDate = new Date(progress.date);

    const existingProgressIndex = habit.progress.findIndex((p: ILearningProgress) =>
        isSameDay(new Date(p.date), progressDate)
    );

    let updatedHabit;

    if (existingProgressIndex !== -1) {
        const newCount = habit.progress[existingProgressIndex].count + progress.count;
        const updatePath = `progress.${existingProgressIndex}.count`;
        updatedHabit = await LearningHabitModel.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: { [updatePath]: newCount } },
            { new: true }
        );
    } else {
        updatedHabit = await LearningHabitModel.findOneAndUpdate(
            { _id: id, user: userId },
            { $push: { progress: { date: progressDate, count: progress.count } } },
            { new: true }
        );
    }

    if (updatedHabit) {
        const newProgressTotal = sumInRange(updatedHabit.progress, from, to);
        const justCompleted = newProgressTotal >= updatedHabit.target && oldProgressTotal < updatedHabit.target;
        const xpToAdd = justCompleted ? (10 + Math.min(50, (updatedHabit.streak || 0) * 2)) : 0;

        const { streak, longestStreak } = updateStreak(updatedHabit);
        updatedHabit.streak = streak;
        updatedHabit.longestStreak = longestStreak;
        updatedHabit.xp += xpToAdd;
        await updatedHabit.save();
    }

    return updatedHabit;
};


// FIX: New and correct implementation for removing progress
export const removeHabitProgress = async (
    id: string,
    userId: string | Types.ObjectId,
    date: Date
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: id, user: userId }).exec();
    if (!habit) return null;

    // Normalize input date to start of day for matching
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const { from, to } = computeWindow(habit);
    const oldProgressTotal = sumInRange(habit.progress, from, to);
    const wasCompleted = oldProgressTotal >= habit.target;

    // Find progress by normalized date
    const progressToRemove = habit.progress.find((p: ILearningProgress) => {
        const pDate = new Date(p.date);
        pDate.setHours(0, 0, 0, 0);
        return pDate.getTime() === normalizedDate.getTime();
    });

    // Find freeze by normalized date
    const freezeToRemove = habit.freezes.find((f: IFreezeDay) => {
        const fDate = new Date(f.date);
        fDate.setHours(0, 0, 0, 0);
        return fDate.getTime() === normalizedDate.getTime();
    });

    let updateObject = {};

    if (progressToRemove) {
        // Prefer to remove by _id if available for exact match
        if (progressToRemove._id) {
            updateObject = { $pull: { progress: { _id: progressToRemove._id } } };
        } else {
            // fallback to date match if no _id
            updateObject = { $pull: { progress: { date: normalizedDate } } };
        }
    } else if (freezeToRemove) {
        updateObject = { $pull: { freezes: { date: normalizedDate } } };
    } else {
        // No matching progress or freeze found to remove
        return habit;
    }

    const updatedHabit = await LearningHabitModel.findOneAndUpdate(
        { _id: id, user: userId },
        updateObject,
        { new: true }
    );

    if (updatedHabit) {
        const newProgressTotal = sumInRange(updatedHabit.progress, from, to);
        const isStillCompleted = newProgressTotal >= updatedHabit.target;
        const xpToRemove = wasCompleted && !isStillCompleted
            ? (10 + Math.min(50, (updatedHabit.streak || 0) * 2))
            : 0;
        updatedHabit.xp = Math.max(0, updatedHabit.xp - xpToRemove);

        const { streak, longestStreak } = updateStreak(updatedHabit);
        updatedHabit.streak = streak;
        updatedHabit.longestStreak = longestStreak;
        await updatedHabit.save();
    }

    return updatedHabit;
};



// ADD FREEZE
export const addFreeze = async (
    habitId: string,
    userId: string | Types.ObjectId,
    date: Date
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId }).exec();
    if (!habit || habit.frequency !== 'daily' || !canFreeze(habit, date) || habit.progress.some((p: ILearningProgress) => isSameDay(new Date(p.date), date))) {
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