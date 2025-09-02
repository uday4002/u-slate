import { NextResponse, NextRequest } from "next/server";
import { addFreeze } from "@/services/learninghabit.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";


// POST: freeze a day to protect streak
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const { id } = await params;
        const userId = getUserIdFromToken(req);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date } = await req.json();
        if (!date) {
            return NextResponse.json({ error: "Missing freeze date" }, { status: 400 });
        }

        const freezeDate = new Date(date);
        const result = await addFreeze(id, userId, freezeDate);

        if (!result) {
            return NextResponse.json({ error: "Cannot add freeze (limit exceeded or already frozen)" }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
