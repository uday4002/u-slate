"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FaBars,
    FaListCheck,
    FaDollarSign,
    FaFile,
    FaFileCode,
    FaBookOpen,
    FaUser,
    FaCertificate
} from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import { LuHouse } from "react-icons/lu";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false); // default closed for mobile
    const [isDesktop, setIsDesktop] = useState(false);
    const pathname = usePathname() || "";

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(true);
                setIsDesktop(true);
            } else {
                setIsDesktop(false);
                setIsOpen(false);
            }
        };

        handleResize(); // initialize
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: <LuHouse /> },
        { name: "Tasks", href: "/tasks", icon: <FaListCheck /> },
        { name: "Budget", href: "/budget", icon: <FaDollarSign /> },
        { name: "LearningHabits", href: "/learninghabits", icon: <FaFile /> },
        { name: "Projects", href: "/projects", icon: <FaFileCode /> },
        { name: "Certifications", href: "/certifications", icon: <FaCertificate /> },
        { name: "Journals", href: "/journals", icon: <FaBookOpen /> },
        { name: "Public-Profiles", href: "/public-profiles", icon: <FaUser /> },
        { name: "Account", href: "/account", icon: <FaUserCircle /> },
    ];


    return (
        <>
            {/* Overlay for mobile */}
            {!isDesktop && isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
          fixed top-0 left-0 h-screen bg-[rgba(0,0,0,1)] text-white flex flex-col z-999
          ${isOpen ? "w-48" : "w-14 relative"}
          lg:relative lg:w-56
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        {!isDesktop && (
                            <FaBars
                                className="text-xl cursor-pointer hover:text-gray-300 transition-colors"
                                onClick={() => setIsOpen(prev => !prev)}
                            />
                        )}
                        {isOpen && (
                            <Link href="/dashboard" className="font-bold sm:text-2xl text-lg">
                                U-slate
                            </Link>
                        )}
                    </div>
                </div>

                {/* Links */}
                <nav className="flex-1 flex flex-col mt-4">
                    {links.map(link => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 p-3 mx-2 rounded-md transition-colors duration-200
                                ${active ? "bg-gray-700" : "hover:bg-gray-800"}
                                `}
                                onClick={() => {
                                    if (!isDesktop) setIsOpen(false); // auto-close mobile
                                }}
                            >
                                <span className="text-sm sm:text-lg">{link.icon}</span>
                                {isOpen && <span className="text-sm sm:text-lg">{link.name}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
