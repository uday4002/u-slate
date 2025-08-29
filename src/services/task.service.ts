import Task, { ITask } from "@/server/models/Task";
import { HydratedDocument, Types } from "mongoose";

// Mongoose document type
export type TaskDocument = HydratedDocument<ITask>;

// CREATE TASK
export const createTask = async (
    data: Partial<ITask>
): Promise<TaskDocument> => {
    const task = new Task(data);
    return await task.save();
};

// GET TASKS BY USER 
export const getTasksByUser = async (
    userId: string,
    filters?: {
        status?: "pending" | "inprogress" | "completed";
        priority?: "low" | "medium" | "high";
    }
): Promise<TaskDocument[]> => {
    const query: Partial<ITask> & { user: Types.ObjectId } = {
        user: new Types.ObjectId(userId),
    };

    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;

    return await Task.find(query).exec();
};

// UPDATE TASK
export const updateTask = async (
    taskId: string,
    data: Partial<ITask>,
    userId: string | Types.ObjectId
): Promise<TaskDocument | null> => {
    return await Task.findOneAndUpdate(
        { _id: taskId, user: userId },
        data,
        { new: true }
    ).exec();
};

// DELETE TASK
export const deleteTask = async (
    taskId: string,
    userId: string | Types.ObjectId
): Promise<TaskDocument | null> => {
    return await Task.findOneAndDelete({ _id: taskId, user: userId }).exec();
};
