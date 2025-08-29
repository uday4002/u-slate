import { NextResponse, NextRequest } from "next/server";
import { Frequency } from "@/server/models/LearningHabit";
import { createLearningHabit, getLearningHabitsByUser } from "@/services/learninghabit.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// get all habits for user
export async function GET(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req);
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const entries = await getLearningHabitsByUser(userId);
        return NextResponse.json(entries);
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST: create new habit
export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req);
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { title, category, frequency, target } = await req.json();
        if (!title || !target || !frequency) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const newHabit = await createLearningHabit({
            title,
            category,
            frequency: frequency as Frequency,
            target: Number(target),
            user: userId
        });
        return NextResponse.json(newHabit);
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}