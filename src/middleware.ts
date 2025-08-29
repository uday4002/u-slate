import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = [
    "/",
    "/about",
    "/contact",
    "/reset-password",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/verify-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("authToken")?.value;

    // Allow public paths without auth
    if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"))) {
        return NextResponse.next();
    }

    // Only redirect to /login if not already on /login or /signup
    if (!token) {
        if (pathname !== "/login" && pathname !== "/signup") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET!);
        // Prevent logged-in users from visiting login or signup pages
        if (pathname === "/login" || pathname === "/signup") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    } catch (err) {
        console.log("Invalid token:", err);
        if (pathname !== "/login" && pathname !== "/signup") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard",
        "/tasks",
        "/budget",
        "/journals",
        "/projects",
        "/certifications",
        "/public-profiles",
        "/account",
        "/learninghabits",
        "/login",
        "/signup",
        "/api/:path*",
    ],
    runtime: "nodejs",
};
