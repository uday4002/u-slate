import { NextRequest, NextResponse } from "next/server";
import User from "@/server/models/User";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";


export const GET = async (req: NextRequest) => {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req);

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};
