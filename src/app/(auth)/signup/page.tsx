"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [form, setForm] = useState<{ name: string; email: string; password: string; otp: string }>({
        name: "",
        email: "",
        password: "",
        otp: "",
    });
    const [step, setStep] = useState<"signup" | "verify">("signup");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [errorFields, setErrorFields] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

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
            const value = form[field as keyof typeof form];

            if (!value) {
                errors[field] = "Please fill this field";
            }

            if (field === "email" && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[field] = "Please enter a valid email";
                }
            }

            if (field === "otp" && value && value.length < 4) {
                errors[field] = "OTP must be at least 4 digits";
            }
        });
        setErrorFields(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateFields(["name", "email", "password"])) return;

        setLoading(true);

        try {
            await axios.post("/api/auth/signup", {
                name: form.name,
                email: form.email,
                password: form.password,
            });
            setStep("verify");
            showMessage("OTP sent to your email!", "success");
        } catch (err: any) {
            showMessage(err.response?.data?.error || err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!validateFields(["otp"])) return;

        setLoading(true);

        try {
            await axios.post("/api/auth/verify-otp", {
                email: form.email,
                otp: form.otp,
            });
            showMessage("Email verified successfully! Redirecting...", "success", 2000);
            router.push("/login");
        } catch (err: any) {
            showMessage(err.response?.data?.error || err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleScreenClick = () => setErrorFields({});

    const renderInput = (name: string, type = "text", placeholder = "") => (
        <div className="flex flex-col">
            <input
                name={name}
                type={type}
                placeholder={placeholder}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className={`w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 text-sm sm:text-base ${errorFields[name] ? "border-red-500" : "border-gray-300"
                    }`}
            />
            {errorFields[name] && (
                <span className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errorFields[name]}</span>
            )}
        </div>
    );

    if (!mounted) return null;

    return (
        <div
            className="max-w-full min-h-[calc(100vh-150px)] mx-auto flex flex-col items-center justify-center px-4 pt-10 bg-zinc-950"
            onClick={handleScreenClick}
        >
            <div
                className="w-full p-6 sm:p-8 border rounded-2xl shadow-md flex flex-col gap-3 max-w-md bg-zinc-900 border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {step === "signup" ? (
                    <>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-white">Sign Up</h2>
                        {renderInput("name", "text", "Name")}
                        {renderInput("email", "email", "Email")}
                        {renderInput("password", "password", "Password")}
                        <button
                            onClick={handleSignup}
                            disabled={loading}
                            className={`p-2 sm:p-3 rounded-md self-end transition cursor-pointer text-sm sm:text-base ${loading
                                ? "bg-blue-300 text-white cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                        >
                            {loading ? "Signing up..." : "Sign Up"}
                        </button>

                        <p className="text-xs sm:text-sm mt-3 text-center text-zinc-300">
                            Already have an account?{" "}
                            <span
                                onClick={() => window.location.href = "/login"} // Using standard navigation
                                className="text-blue-400 cursor-pointer hover:underline"
                            >
                                Login
                            </span>
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-white">Verify OTP</h2>
                        {renderInput("otp", "text", "Enter OTP")}
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className={`p-2 sm:p-3 rounded-md self-end transition cursor-pointer text-sm sm:text-base ${loading
                                ? "bg-green-300 text-white cursor-not-allowed"
                                : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </>
                )}

                {message && (
                    <p
                        className={`text-sm sm:text-base px-2 py-1 rounded-md break-words w-full ${message.type === "success" ? "text-green-400" : "text-red-400"
                            }`}
                    >
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}
