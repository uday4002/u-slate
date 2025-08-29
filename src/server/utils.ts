import nodemailer from "nodemailer";
import { NextRequest } from "next/server";
import { PlatformKey } from "@/server/models/PublicProfile";
import jwt from "jsonwebtoken";

export const sendOTPEmail = async (email: string, otp: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Uslate OTP Verification",
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

export const getUserIdFromToken = (req: NextRequest) => {
    const token = req.cookies.get("authToken")?.value;
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        return decoded.userId;
    } catch {
        return null;
    }
};


export const upsertablePlatforms: PlatformKey[] = [
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
];

export function detectPlatformFromUrl(url: string): PlatformKey | undefined {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        const host = u.hostname.replace(/^www\./, "").toLowerCase();
        if (host.includes("linkedin.com")) return "linkedin";
        if (host.includes("github.com")) return "github";
        if (host.includes("leetcode.com")) return "leetcode";
        if (host.includes("hackerrank.com")) return "hackerrank";
        if (host.includes("codeforces.com")) return "codeforces";
        if (host.includes("codechef.com")) return "codechef";
        if (host === "x.com" || host.includes("twitter.com")) return "twitter";
        if (host.includes("kaggle.com")) return "kaggle";
        if (host.includes("stackoverflow.com")) return "stackoverflow";
        if (host.includes("medium.com")) return "medium";
        return "custom";
    } catch {
        return undefined;
    }
}

export function normalizeUrl(url: string) {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "");
}
