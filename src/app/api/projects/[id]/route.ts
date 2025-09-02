import { NextRequest, NextResponse } from "next/server";
import { updateProject, deleteProject } from "@/services/project.service";
import { getUserIdFromToken } from "@/server/utils";
import { connectToDB } from "@/server/db";

// UPDATE a project 
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getUserIdFromToken(req);
    const { id } = await params;
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
        const updatedProject = await updateProject(id, body, userId);
        return NextResponse.json(updatedProject);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
};

// DELETE a project 
export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getUserIdFromToken(req);
    const { id } = await params;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectToDB();
        await deleteProject(id, userId);
        return NextResponse.json({ message: "Project deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
};
