import { NextRequest, NextResponse } from "next/server";
import { recalcAllHabitsAtMidnight } from "@/services/learninghabit.service";

const SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    if (SECRET && secret !== SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await recalcAllHabitsAtMidnight();
        return NextResponse.json({ success: true, message: "Habits recalculated" });
    } catch (error) {
        console.error("Error recalculating habits via cron:", error);
        return NextResponse.json({ success: false, error: "Failed to recalc habits" }, { status: 500 });
    }
}
