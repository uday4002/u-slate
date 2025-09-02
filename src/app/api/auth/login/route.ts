import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/auth.service";
import { connectToDB } from "@/server/db";

export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const { email, password } = await req.json();
        const data = await loginUser(email, password);
        const { token } = data;
        const response = NextResponse.json({ success: true, message: "Login successful", data });
        response.cookies.set({
            name: "authToken",
            value: token,
            httpOnly: true, // prevents JS from reading it
            secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
            sameSite: "lax", // allow browser navigation
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });
        return response;
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
