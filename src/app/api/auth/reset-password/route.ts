import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithOTP } from "@/services/auth.service";
import { connectToDB } from "@/server/db";

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const { email, otp, newPassword } = await req.json();
        const data = await resetPasswordWithOTP(email, otp, newPassword);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
