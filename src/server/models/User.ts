import { Schema, model, models } from "mongoose";

export interface IUser {
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
}, { timestamps: true });

export default models.User || model<IUser>("User", UserSchema);
