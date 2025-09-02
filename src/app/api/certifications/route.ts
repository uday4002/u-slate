import { NextRequest, NextResponse } from "next/server";
import { getCertificationsByUser, createCertification } from "@/services/certification.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// GET certifications for the user
export async function GET(req: NextRequest) {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectToDB();
        const certifications = await getCertificationsByUser(userId);
        return NextResponse.json(certifications);
    } catch (err: any) {
        return NextResponse.json({ error: "Failed to fetch certifications" }, { status: 500 });
    }
}

// create a new certification
export async function POST(req: NextRequest) {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectToDB();
        const body = await req.json();
        const { url } = body || {};
        if (url && !/^https?:\/\/\S+$/.test(url)) {
            return NextResponse.json(
                { error: "'url' must be a valid URL." },
                { status: 400 }
            );
        }
        const created = await createCertification({ ...body, user: userId });
        return NextResponse.json(created);
    } catch (err: any) {
        return NextResponse.json({ error: "Failed to create certification" }, { status: 500 });
    }
}
