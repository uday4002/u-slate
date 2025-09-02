"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [errorFields, setErrorFields] = useState<{ [key: string]: string }>({});
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showMessage = (text: string, type: "success" | "error" = "error", duration = 5000) => {
        setMessage({ text, type });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMessage(null), duration);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrorFields({ ...errorFields, [e.target.name]: "" });
    };

    const validateFields = (fields: string[]) => {
        const errors: { [key: string]: string } = {};
        fields.forEach((field) => {
            if (!form[field as keyof typeof form]) {
                errors[field] = "Please fill this field";
            }
        });
        setErrorFields(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateFields(["email", "password"])) return;

        setLoading(true);

        try {
            setMessage(null);
            await axios.post("/api/auth/login", form);

            showMessage("Login successful! Redirecting...", "success", 2000);
            router.push("/dashboard");
        } catch (err: any) {
            showMessage(err.response?.data?.error || "Login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleScreenClick = () => setErrorFields({});

    if (!mounted) return null;

    return (
        <div
            className="flex items-center justify-center min-h-[calc(100vh-150px)] px-4 bg-zinc-950 text-white"
            onClick={handleScreenClick}
        >
            <div
                className="max-w-md w-full mx-auto mt-12 sm:mt-16 p-4 sm:p-6 md:p-8 border rounded-2xl shadow flex flex-col gap-3 bg-zinc-900 border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-white">
                    Login to U-slate
                </h2>

                {/* Email Input */}
                <div className="flex flex-col">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className={`w-full mb-1 p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base 
                            bg-zinc-800 text-white border-zinc-700 
                            ${errorFields.email ? "border-red-500" : ""}`}
                    />
                    {errorFields.email && (
                        <span className="text-red-500 text-xs sm:text-sm">{errorFields.email}</span>
                    )}
                </div>

                {/* Password Input */}
                <div className="flex flex-col">
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className={`w-full mb-1 p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base 
                            bg-zinc-800 text-white border-zinc-700
                            ${errorFields.password ? "border-red-500" : ""}`}
                    />
                    {errorFields.password && (
                        <span className="text-red-500 text-xs sm:text-sm">{errorFields.password}</span>
                    )}
                </div>

                {/* Global Message */}
                {message && (
                    <p
                        className={`text-sm sm:text-base rounded-md break-words w-full ${message.type === "success" ? "text-green-400" : "text-red-400"}`}
                    >
                        {message.text}
                    </p>
                )}

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`p-2 sm:p-3 rounded-md transition cursor-pointer self-end min-w-[80px] text-sm sm:text-base 
                        ${loading ? "bg-blue-300 text-white cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                {/* Links */}
                <p className="text-xs sm:text-sm text-center mt-1 text-zinc-300">
                    <a href="/reset-password" className="text-blue-400 hover:underline">
                        Forgot Password?
                    </a>
                </p>
                <p className="text-xs sm:text-sm text-center text-zinc-300">
                    Don’t have an account?{" "}
                    <a href="/signup" className="text-blue-400 hover:underline">
                        Sign Up
                    </a>
                </p>
            </div>
        </div>
    );
}
