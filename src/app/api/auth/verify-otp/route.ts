import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/services/auth.service";
import { connectToDB } from "@/server/db";

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const { email, otp } = await req.json();
        const user = await verifyOTP(email, otp);
        return NextResponse.json({ message: "Verified", userId: user._id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
