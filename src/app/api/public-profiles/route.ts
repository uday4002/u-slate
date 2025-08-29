import { NextRequest, NextResponse } from "next/server";
import { createPublicProfile, getPublicProfilesByUser } from "@/services/publicProfile.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// GET user's public profiles
export async function GET(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const profiles = await getPublicProfilesByUser(userId);
        return NextResponse.json(profiles);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }
}

// create a new public profile
export async function POST(req: NextRequest) {
    try {
        await connectToDB();
        const userId = getUserIdFromToken(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, username, url, platform } = body || {};
        if (!name?.trim() || !username?.trim() || !url?.trim()) {
            return NextResponse.json({ error: "name, username and url are required" }, { status: 400 });
        }

        const profile = await createPublicProfile(userId, { name, username, url, platform });
        return NextResponse.json(profile);
    } catch (e: any) {
        if (e?.code === 11000) {
            return NextResponse.json({ error: "Profile already exists for this platform & username" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }
}
