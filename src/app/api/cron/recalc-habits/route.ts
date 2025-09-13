import { NextRequest, NextResponse } from "next/server";
import { recalcAllHabitsAtMidnight } from "@/services/learninghabit.service";

const SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    try {
        await recalcAllHabitsAtMidnight();
        return NextResponse.json({ success: true, message: "Habits recalculated" });
    } catch (error) {
        console.error("Error recalculating habits via cron:", error);
        return NextResponse.json({ success: false, error: "Failed to recalc habits" }, { status: 500 });
    }
}
