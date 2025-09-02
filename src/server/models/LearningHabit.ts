import { Schema, model, models, Types, Document } from "mongoose";

export type Frequency = "daily" | "weekly";

export interface ILearningProgress {
    date: Date;
    count: number;
}

export interface IFreezeDay {
    date: Date;
}

export interface ILearningHabit extends Document {
    user: Types.ObjectId;
    title: string;
    category?: string;
    frequency: Frequency;
    target: number;
    progress: ILearningProgress[];
    streak: number;
    longestStreak: number;
    xp: number;
    freezes: IFreezeDay[];
    createdAt?: Date;
    updatedAt?: Date;
}

const LearningHabitSchema = new Schema<ILearningHabit>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        category: { type: String, default: "General" },
        frequency: { type: String, enum: ["daily", "weekly"], required: true },
        target: { type: Number, required: true },
        progress: [
            {
                date: { type: Date, required: true },
                count: { type: Number, required: true },
            },
        ],
        streak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        freezes: [
            {
                date: { type: Date, required: true },
            }
        ]
    },
    { timestamps: true }
);

const LearningHabitModel = models.LearningHabit || model<ILearningHabit>("LearningHabit", LearningHabitSchema);

export default LearningHabitModel;
