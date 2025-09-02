import { NextRequest, NextResponse } from "next/server";
import { createJournal, getJournalsByUser } from "@/services/journal.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// GET all journals for a user
export const GET = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const journals = await getJournalsByUser(userId);
        return NextResponse.json(journals);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 });
    }
};

// CREATE a new journal
export const POST = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const body = await req.json();
        const journal = await createJournal({ ...body, user: userId });
        return NextResponse.json(journal);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
    }
};
