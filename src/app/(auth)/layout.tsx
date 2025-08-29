import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen antialiased bg-zinc-950 text-white">
            <Navbar />
            <main className="container mx-auto px-4 flex-grow pt-18 sm:pt-12 sm:pb-6">
                {children}
            </main>
            <Footer />
        </div>
    );
}
