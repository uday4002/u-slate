import { NextRequest, NextResponse } from "next/server";
import { signupUser } from "@/services/auth.service";
import { connectToDB } from "@/server/db";

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const { name, email, password } = await req.json();
        const data = await signupUser({ name, email, password });
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
