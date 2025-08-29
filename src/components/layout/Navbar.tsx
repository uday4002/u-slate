"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

// Type for a single navigation link
interface NavLink {
    href: string;
    label: string;
}

const navLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Signup" },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const pathname = usePathname();

    // Hide links & hamburger on login/signup pages
    const hideLinks = pathname === "/login" || pathname === "/signup";

    return (
        <nav className="bg-[#333] p-4 fixed top-0 left-0 w-full pr-8 max-h-[64px] z-50">
            <div className="flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-white">
                    U-slate
                </Link>

                {!hideLinks && (
                    <>
                        {/* Desktop Menu */}
                        <div className="hidden md:flex gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-white hover:text-gray-400 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Hamburger Button */}
                        <button
                            className="md:hidden text-white text-2xl"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle Menu"
                        >
                            ☰
                        </button>
                    </>
                )}
            </div>

            {/* Mobile Menu Overlay */}
            {!hideLinks && isOpen && (
                <div className="absolute top-full left-0 w-full bg-[#333] flex flex-col gap-4 md:hidden z-50 pb-4">
                    <hr className="border-gray-600 p-0" />
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-white hover:text-gray-400 transition-colors pl-4"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Overlay Background */}
            {!hideLinks && isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </nav>
    );
};

export default Navbar;
