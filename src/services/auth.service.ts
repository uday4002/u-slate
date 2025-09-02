import User, { IUser } from "@/server/models/User";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/server/utils";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";


export type UserDocument = IUser & { _id: ObjectId; createdAt: Date; updatedAt: Date };

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// SIGNUP 
export const signupUser = async (
    data: Partial<IUser>
): Promise<{ userId: ObjectId }> => {
    const { name, email, password } = data;
    if (!name || !email || !password) throw new Error("Missing required fields");

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
    });

    await sendOTPEmail(email, otp);
    return { userId: newUser._id };
};

// VERIFY OTP
export const verifyOTP = async (
    email: string,
    otp: string
): Promise<UserDocument> => {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("User already verified");
    if (user.otp !== otp) throw new Error("Invalid OTP");
    if (user.otpExpires && user.otpExpires < new Date()) throw new Error("OTP expired");

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return user;
};

// LOGIN
export const loginUser = async (
    email: string,
    password: string
): Promise<{ token: string; userId: ObjectId }> => {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid password");

    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");

    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { token, userId: user._id };
};

// SEND PASSWORD RESET OTP 
export const sendPasswordResetOTP = async (
    email: string
): Promise<{ message: string }> => {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new Error("User not found");

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOTPEmail(email, otp);
    return { message: "OTP sent to email" };
};

// RESET PASSWORD 
export const resetPasswordWithOTP = async (
    email: string,
    otp: string,
    newPassword: string
): Promise<{ message: string }> => {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new Error("User not found");
    if (user.otp !== otp) throw new Error("Invalid OTP");
    if (user.otpExpires && user.otpExpires < new Date()) throw new Error("OTP expired");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: "Password reset successfully" };
};


