import { NextRequest, NextResponse } from "next/server";
import { updateCertification, deleteCertification } from "@/services/certification.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";


// update an existing certification
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { name, organisation, issuedDate, url } = body || {};

    if (issuedDate && isNaN(Date.parse(issuedDate))) {
        return NextResponse.json(
            { error: "'issuedDate' must be a valid date." },
            { status: 400 }
        );
    }

    if (url && !/^https?:\/\/\S+$/.test(url)) {
        return NextResponse.json(
            { error: "'url' must be a valid URL." },
            { status: 400 }
        );
    }
    try {
        await connectToDB();
        const updated = await updateCertification(id, {
            name,
            organisation,
            issuedDate: issuedDate ? new Date(issuedDate) : undefined,
            url,
        }, userId);

        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// delete a certification
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserIdFromToken(req);
    const { id } = await params;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const removed = await deleteCertification(id, userId);

        if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
