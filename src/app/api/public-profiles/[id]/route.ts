import { NextRequest, NextResponse } from "next/server";
import { updatePublicProfile, deletePublicProfile } from "@/services/publicProfile.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// update user's public profile
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const { id } = await params;
        const userId = getUserIdFromToken(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const updated = await updatePublicProfile(id, userId, body);

        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(updated);
    } catch (e: any) {
        console.error("PUT /api/public-profiles/:id error", e);
        if (e?.code === 11000) {
            return NextResponse.json(
                { error: "Profile already exists for this platform & username" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

// delete user's public profile
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const { id } = await params;
        const userId = getUserIdFromToken(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await deletePublicProfile(id, userId);

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("DELETE /api/public-profiles/:id error", e);
        return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
    }
}
