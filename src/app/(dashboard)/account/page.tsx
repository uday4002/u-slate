"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/utils/spinner";
import axios from "axios";

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

type User = {
    _id: string;
    name: string;
    email: string;
};

const AccountPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const router = useRouter();

    // Fetch user on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/auth/me");
                const userDetails = res.data;
                setUser({
                    _id: userDetails._id,
                    name: userDetails.name,
                    email: userDetails.email,
                });
            } catch (err) {
                console.error("Not authenticated or failed to fetch user", err);
                // Redirect if unauthenticated
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push("/login");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        try {
            await axios.get("/api/auth/logout");
            router.push("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <div className="bg-zinc-950 min-h-screen px-4 sm:px-6 lg:px-8 py-6 flex justify-center items-center">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
                {/* Header */}
                <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left text-white">
                    Account Details
                </h1>

                {/* Spinner while fetching user */}
                {loading && (
                    <div className="flex justify-center py-10">
                        <Spinner />
                    </div>
                )}

                {/* Personal Info */}
                {!loading && user && (
                    <>
                        <div className="flex flex-col gap-4">
                            {/* Name */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm sm:text-base text-zinc-300">Name</label>
                                <input
                                    type="text"
                                    value={user.name || ""}
                                    disabled
                                    className="p-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 cursor-not-allowed text-sm sm:text-base"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm sm:text-base text-zinc-300">Email</label>
                                <input
                                    type="email"
                                    value={user.email || ""}
                                    disabled
                                    className="p-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 cursor-not-allowed text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base font-medium cursor-pointer self-end"
                        >
                            Logout
                        </button>
                    </>
                )}

                {/* Fallback */}
                {!loading && !user && (
                    <p className="text-center text-red-500 text-sm sm:text-base">
                        Failed to load account details. Please log in again.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AccountPage;