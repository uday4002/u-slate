"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "verify">("request");
    const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const showMessage = (text: string, duration = 5000) => {
        setMessage(text);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMessage(""), duration);
    };

    const requestOTP = async () => {
        if (!form.email) {
            showMessage("Email is required.");
            return;
        }
        setLoading(true);
        try {
            await axios.post("/api/auth/forgot-password", { email: form.email });
            setStep("verify");
            showMessage("OTP sent to your email!");
        } catch (err: any) {
            showMessage(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async () => {
        if (!form.otp || !form.newPassword) {
            showMessage("Both OTP and new password are required.");
            return;
        }
        setLoading(true);
        try {
            await axios.post("/api/auth/reset-password", {
                email: form.email,
                otp: form.otp,
                newPassword: form.newPassword,
            });
            showMessage("Password reset successfully! Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            showMessage(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div
            className="max-w-full min-h-[calc(100vh-150px)] mx-auto flex flex-col items-center justify-center px-4 pt-10 bg-zinc-950 text-white"
        >
            <div
                className="w-full p-6 sm:p-8 border rounded-2xl shadow-md max-w-md bg-zinc-900 border-zinc-800"
            >
                {step === "request" ? (
                    <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">Forgot Password</h2>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full mb-2 p-2 sm:p-3 border rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 bg-zinc-800 text-white border-zinc-700"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={requestOTP}
                                disabled={loading}
                                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md transition cursor-pointer text-sm sm:text-base ${loading
                                    ? "bg-blue-300 text-white cursor-not-allowed"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">Reset Password</h2>
                        <input
                            name="otp"
                            placeholder="Enter OTP"
                            value={form.otp}
                            onChange={handleChange}
                            className="w-full mb-2 p-2 sm:p-3 border rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 bg-zinc-800 text-white border-zinc-700"
                        />
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            value={form.newPassword}
                            onChange={handleChange}
                            className="w-full mb-2 p-2 sm:p-3 border rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 bg-zinc-800 text-white border-zinc-700"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={resetPassword}
                                disabled={loading}
                                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md transition cursor-pointer text-sm sm:text-base ${loading
                                    ? "bg-green-300 text-white cursor-not-allowed"
                                    : "bg-green-500 text-white hover:bg-green-600"
                                    }`}
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </>
                )}
                {message && (
                    <p
                        className={`mt-2 text-sm sm:text-base ${message.includes("successfully") || message.includes("OTP sent")
                            ? "text-green-400"
                            : "text-red-400"
                            } text-left`}
                    >
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
