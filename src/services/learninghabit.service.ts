import LearningHabitModel, { ILearningHabit, ILearningProgress, Frequency, IFreezeDay } from "@/server/models/LearningHabit";
import { HydratedDocument, Types } from "mongoose";
import { DateTime } from "luxon";

export type LearningHabitDocument = HydratedDocument<ILearningHabit>;

const USER_TIMEZONE = "Asia/Kolkata";

// Luxon helpers to ensure all date ops use UTC internally
const toUtc = (d: Date | string | DateTime) =>
    d instanceof DateTime ? d.toUTC() : DateTime.fromJSDate(new Date(d)).toUTC();

const toUserTz = (d: Date | string | DateTime, tz = USER_TIMEZONE) =>
    d instanceof DateTime ? d.setZone(tz) : DateTime.fromJSDate(new Date(d)).setZone(tz);

const startOfUtcDay = (d: Date | string | DateTime) => toUtc(d).startOf("day");
const endOfUtcDay = (d: Date | string | DateTime) => toUtc(d).endOf("day");
const weekStartUtc = (d: Date | string | DateTime) => toUtc(d).startOf("week").plus({ days: 1 }); // ISO Monday start
const weekEndUtc = (d: Date | string | DateTime) => weekStartUtc(d).plus({ days: 6 }).endOf("day");

const sumInRange = (entries: ILearningProgress[], from: DateTime, to: DateTime) =>
    entries.reduce((acc, p) => {
        const entryDate = toUtc(p.date);
        return entryDate >= from && entryDate <= to ? acc + (p.count || 0) : acc;
    }, 0);

const isSameDayUtc = (a: Date | string | DateTime, b: Date | string | DateTime) =>
    startOfUtcDay(a).toMillis() === startOfUtcDay(b).toMillis();

const isSameWeekUtc = (a: Date | string | DateTime, b: Date | string | DateTime) =>
    weekStartUtc(a).toMillis() === weekStartUtc(b).toMillis();

// Freeze logic
export const canFreeze = (h: ILearningHabit, date: Date | string) => {
    const dateUtc = toUtc(date);
    const freezesThisMonth = (h.freezes || []).filter(f => {
        const fd = toUtc(f.date);
        return fd.year === dateUtc.year && fd.month === dateUtc.month;
    });
    return freezesThisMonth.length < 2;
};

// Compute the current progress window depending on frequency (all in UTC)
export const computeWindow = (h: ILearningHabit) => {
    if (h.frequency === "weekly") {
        const from = weekStartUtc(new Date());
        const to = weekEndUtc(new Date());
        return { from, to };
    }
    const today = toUtc(new Date());
    return { from: today.startOf("day"), to: today.endOf("day") };
};

// Compute progress percentage in the current window
export const computeProgressPercent = (h: ILearningHabit) => {
    const { from, to } = computeWindow(h);
    const done = sumInRange(h.progress || [], from, to);
    if (!h.target || h.target <= 0) return 0;
    return Math.max(0, Math.min(100, (done / h.target) * 100));
};

// Update streak and longest streak using UTC-normalized dates
export const updateStreak = (h: ILearningHabit) => {
    const today = toUtc(new Date()).startOf("day");
    let currentStreak = 0;
    let longestStreak = h.longestStreak;

    const completedOrFrozenDates = [
        ...h.progress.filter(p => (p.count || 0) >= h.target).map(p => toUtc(p.date).startOf("day")),
        ...h.freezes.map(f => toUtc(f.date).startOf("day")),
    ].sort((a, b) => a.toMillis() - b.toMillis());

    if (h.frequency === 'daily') {
        if (completedOrFrozenDates.length === 0) {
            longestStreak = Math.max(longestStreak, 0);
            return { streak: 0, longestStreak };
        }
        const lastDate = completedOrFrozenDates[completedOrFrozenDates.length - 1];
        const yesterday = today.minus({ days: 1 });
        const isLastActivityToday = isSameDayUtc(lastDate, today);
        const isLastActivityYesterday = isSameDayUtc(lastDate, yesterday);

        if (!isLastActivityToday && !isLastActivityYesterday) {
            longestStreak = Math.max(longestStreak, 0);
            return { streak: 0, longestStreak };
        }

        currentStreak = isLastActivityToday ? 1 : 0;

        for (let i = completedOrFrozenDates.length - 2; i >= 0; i--) {
            const currentDate = completedOrFrozenDates[i];
            const nextDate = completedOrFrozenDates[i + 1];
            if (nextDate.diff(currentDate, "days").days <= 1.01) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else { // weekly
        const weeklyProgress: { [key: string]: number } = {};
        h.progress.forEach(p => {
            const weekStart = weekStartUtc(p.date).toISO();
            if (weekStart !== null) {  // Skip if toISO returns null
                weeklyProgress[weekStart] = (weeklyProgress[weekStart] || 0) + (p.count || 0);
            }
        });


        const completedWeeks = new Set<string>();
        for (const weekStart in weeklyProgress) {
            if (weeklyProgress[weekStart] >= h.target) {
                completedWeeks.add(weekStart);
            }
        }
        h.freezes.forEach(f => {
            const isoWeekStart = weekStartUtc(f.date).toISO() ?? "";
            completedWeeks.add(isoWeekStart);
        });


        const sortedWeeks = Array.from(completedWeeks).sort();
        if (sortedWeeks.length === 0) return { streak: 0, longestStreak };

        const lastWeekStart = DateTime.fromISO(sortedWeeks[sortedWeeks.length - 1]);
        const thisWeekStart = weekStartUtc(today);
        const lastWeekStartCalc = thisWeekStart.minus({ weeks: 1 });

        const isLastActivityThisWeek = isSameWeekUtc(lastWeekStart, today);
        const isLastActivityLastWeek = isSameWeekUtc(lastWeekStart, lastWeekStartCalc);

        if (!isLastActivityThisWeek && !isLastActivityLastWeek) {
            return { streak: 0, longestStreak };
        }

        currentStreak = isLastActivityThisWeek ? 1 : 0;

        for (let i = sortedWeeks.length - 2; i >= 0; i--) {
            const currentWeekDate = DateTime.fromISO(sortedWeeks[i]);
            const nextWeekDate = DateTime.fromISO(sortedWeeks[i + 1]);
            if (nextWeekDate.diff(currentWeekDate, "weeks").weeks <= 1.01) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    return { streak: currentStreak, longestStreak };
};

// Award XP based on just completing the window
export const awardXp = (h: ILearningHabit, justCompletedWindow: boolean) => {
    let xp = h.xp || 0;
    if (justCompletedWindow) {
        xp += 10 + Math.min(50, (h.streak || 0) * 2);
    }
    return xp;
};

// Create a new habit
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

// Get all habits for a user
export const getLearningHabitsByUser = async (
    userId: string
): Promise<LearningHabitDocument[]> => {
    return await LearningHabitModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
};

// Update a habit by id and user
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

// Delete habit
export const deleteLearningHabit = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<LearningHabitDocument | null> => {
    return await LearningHabitModel.findOneAndDelete({ _id: id, user: userId }).exec();
};

// Add or update habit progress
export const addHabitProgress = async (
    id: string,
    userId: string | Types.ObjectId,
    progress: { date: Date; count: number }
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: id, user: userId }).exec();
    if (!habit) return null;

    const { from, to } = computeWindow(habit);
    const oldProgressTotal = sumInRange(habit.progress, from, to);

    // The Fix: Create the date object in the user's timezone first
    const progressDateUserTz = toUserTz(new Date()).toJSDate();
    const progressDateUtc = startOfUtcDay(progressDateUserTz);

    const existingProgressIndex = habit.progress.findIndex((p: ILearningProgress) =>
        isSameDayUtc(p.date, progressDateUtc)
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
            { $push: { progress: { date: progressDateUtc.toJSDate(), count: progress.count } } },
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

// Remove habit progress or freeze on a specific date
export const removeHabitProgress = async (
    id: string,
    userId: string | Types.ObjectId,
    date: Date
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: id, user: userId }).exec();
    if (!habit) return null;

    const normalizedDateUtc = startOfUtcDay(date);
    const { from, to } = computeWindow(habit);
    const oldProgressTotal = sumInRange(habit.progress, from, to);
    const wasCompleted = oldProgressTotal >= habit.target;

    const progressToRemove = habit.progress.find((p: ILearningProgress) =>
        isSameDayUtc(p.date, normalizedDateUtc)
    );

    const freezeToRemove = habit.freezes.find((f: ILearningProgress) =>
        isSameDayUtc(f.date, normalizedDateUtc)
    );

    let updateObject = {};

    if (progressToRemove) {
        updateObject = progressToRemove._id
            ? { $pull: { progress: { _id: progressToRemove._id } } }
            : { $pull: { progress: { date: normalizedDateUtc.toJSDate() } } };
    } else if (freezeToRemove) {
        updateObject = { $pull: { freezes: { date: normalizedDateUtc.toJSDate() } } };
    } else {
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

// Add a freeze day (only for daily habits)
export const addFreeze = async (
    habitId: string,
    userId: string | Types.ObjectId,
    date: Date
): Promise<LearningHabitDocument | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId }).exec();
    if (
        !habit ||
        habit.frequency !== 'daily' ||
        !canFreeze(habit, date) ||
        habit.progress.some((p: ILearningProgress) => isSameDayUtc(p.date, date))
    ) {
        return null;
    }

    const freezeDateUtc = startOfUtcDay(date);

    const updatedHabit = await LearningHabitModel.findOneAndUpdate(
        { _id: habitId, user: userId },
        { $push: { freezes: { date: freezeDateUtc.toJSDate() } } },
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
