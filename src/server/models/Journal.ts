import { Schema, Types, model, models } from "mongoose";

export interface IJournal {
    title: string;
    content: string;
    mood?: string;
    date: Date;
    user: Types.ObjectId; // reference to User
    createdAt?: Date;
    updatedAt?: Date;
}

const JournalSchema = new Schema<IJournal>(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true, trim: true },
        mood: { type: String, trim: true }, // optional
        date: { type: Date, required: true, default: Date.now },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true }
);

const Journal = models.Journal || model<IJournal>("Journal", JournalSchema);
export default Journal;
