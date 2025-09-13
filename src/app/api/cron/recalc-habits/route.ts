import { NextRequest, NextResponse } from "next/server";
import { recalcAllHabitsAtMidnight } from "@/services/learninghabit.service";
import { connectToDB } from "@/server/db";


export async function GET(req: NextRequest) {
    try {
        await connectToDB();
        await recalcAllHabitsAtMidnight();
        return NextResponse.json({ success: true, message: "Habits recalculated" });
    } catch (error) {
        console.error("Error recalculating habits via cron:", error);
        return NextResponse.json({ success: false, error: "Failed to recalc habits" }, { status: 500 });
    }
}
