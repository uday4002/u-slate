import { NextRequest, NextResponse } from "next/server";
import { updateTask, deleteTask } from "@/services/task.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// Update task
export const PUT = async (
    req: NextRequest, { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!id)
        return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    const body = await req.json();

    try {
        await connectToDB();
        const updatedTask = await updateTask(id, body, userId);
        return NextResponse.json(updatedTask);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to update task" }, { status: 500 });
    }
};

// Delete task
export const DELETE = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const userId = getUserIdFromToken(req);
    const { id } = await params;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!id)
        return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    try {
        await connectToDB();
        await deleteTask(id, userId);
        return NextResponse.json({ message: "Task deleted successfully" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to delete task" }, { status: 500 });
    }
};
