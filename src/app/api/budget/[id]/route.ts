import { NextResponse, NextRequest } from "next/server";
import { updateBudgetEntry, deleteBudgetEntry } from "@/services/budget.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const resolvedParams = await params;
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = resolvedParams.id;
        const patch = await req.json();

        const updated = await updateBudgetEntry(id, userId, patch);
        if (!updated) {
            return NextResponse.json({ error: "Not found or not allowed" }, { status: 404 });
        }

        return NextResponse.json({ entry: updated });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const resolvedParams = await params;
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ok = await deleteBudgetEntry(resolvedParams.id, userId);
        if (!ok) {
            return NextResponse.json({ error: "Not found or not allowed" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
