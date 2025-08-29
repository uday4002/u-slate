import { Schema, Types, model, models } from "mongoose";

export type PlatformKey = "linkedin" | "github" | "leetcode" | "hackerrank" | "codeforces" | "codechef" | "twitter" | "kaggle" | "stackoverflow" | "medium" | "custom";

export interface IPublicProfile {
    user: Types.ObjectId; // Reference to User 
    platform: PlatformKey;
    name: string;
    username: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}

const PublicProfileSchema = new Schema<IPublicProfile>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        platform: {
            type: String,
            enum: [
                "linkedin",
                "github",
                "leetcode",
                "hackerrank",
                "codeforces",
                "codechef",
                "twitter",
                "kaggle",
                "stackoverflow",
                "medium",
                "custom",
            ],
            required: true,
            default: "custom",
            index: true,
        },
        name: { type: String, required: true, trim: true },
        username: { type: String, required: true, trim: true, index: true },
        url: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);


PublicProfileSchema.index({ user: 1, platform: 1, username: 1 }, { unique: true });

export default models.PublicProfile || model<IPublicProfile>("PublicProfile", PublicProfileSchema);
