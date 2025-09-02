import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetOTP } from "@/services/auth.service";
import { connectToDB } from "@/server/db";

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const { email } = await req.json();
        const data = await sendPasswordResetOTP(email);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
