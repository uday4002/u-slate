import Project, { IProject } from "@/server/models/Project";
import { HydratedDocument, Types } from "mongoose";

// Type for a full Mongoose project document
export type ProjectDocument = HydratedDocument<IProject>;

// CREATE PROJECT
export const createProject = async (
    data: Partial<IProject>
): Promise<ProjectDocument> => {
    const project = new Project(data);
    return await project.save();
};

// GET PROJECTS BY USER 
export const getProjectsByUser = async (
    userId: string
): Promise<ProjectDocument[]> => {
    return await Project.find({ user: userId })
        .sort({ createdAt: -1 })
        .exec();
};

// UPDATE PROJECT
export const updateProject = async (
    id: string,
    data: Partial<IProject>,
    userId: string | Types.ObjectId
): Promise<ProjectDocument | null> => {
    return await Project.findOneAndUpdate(
        { _id: id, user: userId },
        data,
        { new: true }
    ).exec();
};

// DELETE PROJECT 
export const deleteProject = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<ProjectDocument | null> => {
    return await Project.findOneAndDelete({ _id: id, user: userId }).exec();
};
