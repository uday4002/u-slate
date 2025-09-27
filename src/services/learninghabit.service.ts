import { DateTime } from "luxon";
import LearningHabitModel, {
    ILearningHabit,
    ILearningProgress,
    IFreezeDay,
} from "@/server/models/LearningHabit";

const USER_TIMEZONE = "Asia/Kolkata";

// Normalize to start of the day in USER_TIMEZONE (no UTC conversion)
const normalizeDateToLocal = (date: Date | string | DateTime): DateTime => {
    const dt = DateTime.fromJSDate(
        date instanceof DateTime ? date.toJSDate() : new Date(date),
        { zone: USER_TIMEZONE }
    );
    return dt.startOf("day");
};

export const recalculateHabitMetrics = (habit: ILearningHabit): void => {
    if (!habit || !Array.isArray(habit.progress) || habit.progress.length === 0) {
        habit.streak = 0;
        habit.longestStreak = 0;
        habit.xp = 0;
        return;
    }

    const now = DateTime.now().setZone(USER_TIMEZONE).startOf("day");
    const isDaily = habit.frequency === "daily";
    const periodUnit = isDaily ? "days" : "weeks";

    const progressMap = new Map<string, ILearningProgress>();
    for (const entry of habit.progress) {
        const isoDate = normalizeDateToLocal(entry.date).toISODate();
        if (isoDate) progressMap.set(isoDate, entry);
    }

    const freezeDates = new Set(
        (habit.freezes || []).map(f => normalizeDateToLocal("date" in f ? f.date : f).toISODate())
    );

    const earliestProgressDate = habit.progress.reduce((minDate, p) => {
        const date = normalizeDateToLocal(p.date);
        return date < minDate ? date : minDate;
    }, now);

    let checkDate = earliestProgressDate.startOf(periodUnit === "days" ? "day" : "week");

    let currentStreak = 0;
    let longestStreak = 0;
    let xp = 0;

    while (checkDate <= now) {
        const checkDateIso = checkDate.toISODate();
        if (!checkDateIso) {
            checkDate = checkDate.plus({ [periodUnit]: 1 });
            continue;
        }

        const entry = progressMap.get(checkDateIso);
        const isFrozen = freezeDates.has(checkDateIso);
        const isToday = checkDate.hasSame(now, "day");

        if (entry && entry.count >= habit.target) {
            currentStreak++;
            xp += 10 + Math.max(0, entry.count - habit.target);
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else if (isFrozen) {
            // Frozen → preserve streak
        } else if (isToday) {
            // Today is still ongoing → preserve current streak
        } else {
            // Missed day → reset streak
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            currentStreak = 0;
        }

        checkDate = checkDate.plus({ [periodUnit]: 1 });
    }

    habit.streak = Math.max(0, currentStreak);
    habit.longestStreak = longestStreak;
    habit.xp = xp;
};

// The rest of your CRUD functions remain the same
export async function recalcAllHabitsAtMidnight() {
    const habits = await LearningHabitModel.find({});
    for (const habit of habits) {
        recalculateHabitMetrics(habit);
        await habit.save();
    }
}

export const createLearningHabit = async (habitData: Partial<ILearningHabit>): Promise<ILearningHabit> => {
    const newHabit = new LearningHabitModel(habitData);
    await newHabit.save();
    return newHabit;
};

export const getLearningHabitsByUser = async (userId: string): Promise<ILearningHabit[]> => {
    return (await LearningHabitModel.find({ user: userId })) as ILearningHabit[];
};

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

export const deleteLearningHabit = async (habitId: string, userId: string): Promise<Document | null> => {
    return await LearningHabitModel.findOneAndDelete({ _id: habitId, user: userId });
};

export const addHabitProgress = async (
    habitId: string,
    userId: string,
    progressEntry: Omit<ILearningProgress, "date"> & { date: Date }
): Promise<ILearningHabit | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId });
    if (!habit) return null;

    const normalizedDate = normalizeDateToLocal(progressEntry.date);
    const normalizedDateIso = normalizedDate.toISODate();

    const isFrozen = (habit.freezes || []).some((f: IFreezeDay | Date) => {
        const freezeDate = "date" in f ? f.date : f;
        return normalizeDateToLocal(freezeDate).toISODate() === normalizedDateIso;
    });

    if (isFrozen) throw new Error("Cannot add progress on a frozen day.");

    const existingProgress = habit.progress.find(
        (p: ILearningProgress) => normalizeDateToLocal(p.date).toISODate() === normalizedDateIso
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

export const addFreeze = async (
    habitId: string,
    userId: string,
    freezeDate: Date
): Promise<ILearningHabit | null> => {
    const habit = await LearningHabitModel.findOne({ _id: habitId, user: userId });
    if (!habit) return null;

    const normalizedDate = normalizeDateToLocal(freezeDate).toISODate();

    const exists = (habit.freezes || []).some((f: IFreezeDay | Date) => {
        const fDate = "date" in f ? f.date : f;
        return normalizeDateToLocal(fDate as Date).toISODate() === normalizedDate;
    });

    if (exists) return habit;

    habit.freezes = habit.freezes || [];
    habit.freezes.push({ date: normalizeDateToLocal(freezeDate).toJSDate() } as IFreezeDay);

    recalculateHabitMetrics(habit);
    await habit.save();
    return habit;
};
