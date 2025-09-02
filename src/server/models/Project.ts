import { Schema, Types, model, models } from "mongoose";

export interface IProject {
    name: string;
    description: string;
    liveLink?: string;
    githubLink?: string;
    startDate?: Date;
    endDate?: Date;
    user: Types.ObjectId;
}


const ProjectSchema: Schema<IProject> = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        liveLink: {
            type: String,
            trim: true
        },
        githubLink: {
            type: String,
            trim: true
        },
        startDate: { type: Date },
        endDate: { type: Date },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true }
);


export default models.Project || model<IProject>("Project", ProjectSchema);
