import { NextRequest, NextResponse } from "next/server";
import { createTask, getTasksByUser } from "@/services/task.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

export const GET = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = req.nextUrl.searchParams.get("status") as "pending" | "inprogress" | "completed" | undefined;
    const priority = req.nextUrl.searchParams.get("priority") as "low" | "medium" | "high" | undefined;
    try {
        await connectToDB();
        const tasks = await getTasksByUser(userId, { status, priority });
        return NextResponse.json(tasks);
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const body = await req.json();
        const task = await createTask({ ...body, user: userId });
        return NextResponse.json(task);
    } catch (err) {
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
};
