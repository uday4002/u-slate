import { NextRequest, NextResponse } from "next/server";
import { createProject, getProjectsByUser } from "@/services/project.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// GET all projects for a user
export const GET = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const projects = await getProjectsByUser(userId);
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
};

// CREATE a new project
export const POST = async (req: NextRequest) => {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        const body = await req.json();
        const { liveLink, githubLink } = body || {};
        if (liveLink && !/^https?:\/\/\S+$/.test(liveLink)) {
            return NextResponse.json(
                { error: "'liveLink' must be a valid URL." },
                { status: 400 }
            );
        }
        if (githubLink && !/^https?:\/\/\S+$/.test(githubLink)) {
            return NextResponse.json(
                { error: "'githubLink' must be a valid URL." },
                { status: 400 }
            );
        }
        const project = await createProject({ ...body, user: userId });
        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
};
