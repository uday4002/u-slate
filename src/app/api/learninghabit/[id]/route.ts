import { NextResponse, NextRequest } from "next/server";
import { updateLearningHabit, deleteLearningHabit, addHabitProgress, removeHabitProgress } from "@/services/learninghabit.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// UPDATE a habit, add progress, or unmark progress
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getUserIdFromToken(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectToDB();
        const { id } = await params;
        const patch = await req.json();
        let result = null;

        if (patch.progress) {
            const date = patch.progress.date ? new Date(patch.progress.date) : new Date();
            const count = Number(patch.progress.count) || 1;
            result = await addHabitProgress(id, userId, { date, count });
        } else if (patch.unmark) {
            const date = patch.unmark ? new Date(patch.unmark) : new Date();
            result = await removeHabitProgress(id, userId, date);
        } else {
            result = await updateLearningHabit(id, userId, patch);
        }

        if (!result) {
            return NextResponse.json({ error: "Habit not found or cannot be updated" }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : "Something went wrong.";
        return NextResponse.json({ success: false, message: errorMessage },
            { status: 400 });
    }
};

// DELETE a habit
export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getUserIdFromToken(req);
    const { id } = await params;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectToDB();
        const deletedHabit = await deleteLearningHabit(id, userId);
        if (!deletedHabit) {
            return NextResponse.json({ error: "Habit not found or not allowed" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Habit deleted" });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
    }
};