import { Schema, model, models, Types } from "mongoose";

export interface ITask {
    title: string;
    dueDate: Date | null;
    status: "pending" | "inprogress" | "completed";
    priority: "low" | "medium" | "high";
    user: Types.ObjectId; // reference to User
    createdAt?: Date;
    updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true },
        dueDate: { type: Date, default: null },
        status: {
            type: String,
            enum: ["pending", "inprogress", "completed"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true }
);

TaskSchema.index({ user: 1, status: 1 }); // compound index for filtered queries

export default models.Task || model<ITask>("Task", TaskSchema);
