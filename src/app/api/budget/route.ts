import { NextResponse, NextRequest } from "next/server";
import { getBudgetsByUser, createBudgetEntry, getBudgetSummary } from "@/services/budget.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

export async function GET(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const months = Number(req.nextUrl.searchParams.get("months") || "6");

        const entries = await getBudgetsByUser(userId);
        const summary = await getBudgetSummary(userId, months);

        return NextResponse.json({ entries, summary });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, amount, category, date, type } = body;

        if (!title || !category || !amount || !date || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const entry = await createBudgetEntry({
            title,
            amount: Number(amount),
            category,
            date,
            type,
            user: userId,
        });

        return NextResponse.json({ entry }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
