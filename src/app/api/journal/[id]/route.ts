import { NextResponse, NextRequest } from "next/server";
import { updateJournal, deleteJournal } from "@/services/journal.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// UPDATE JOURNAL
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    const userId = getUserIdFromToken(req);
    try {
        await connectToDB();
        const updatedJournal = await updateJournal(id, body, userId);
        if (!updatedJournal) {
            return NextResponse.json({ error: "Journal not found or not owned" }, { status: 404 });
        }
        return NextResponse.json(updatedJournal);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update journal" }, { status: 500 });
    }
}

// DELETE JOURNAL
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = getUserIdFromToken(req);
    try {
        await connectToDB();
        const deletedJournal = await deleteJournal(id, userId);
        if (!deletedJournal) {
            return NextResponse.json({ error: "Journal not found or not owned" }, { status: 404 });
        }
        return NextResponse.json({ message: "Journal deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete journal" }, { status: 500 });
    }
}
