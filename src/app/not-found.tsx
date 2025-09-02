import Link from "next/link";

export default function NotFound() {
    return (
        <main className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
            <div className="text-center px-6">
                <h1 className="text-7xl font-extrabold text-zinc-100 mb-4">404</h1>
                <p className="text-lg text-zinc-400 mb-8">
                    Oops! The page you’re looking for doesn’t exist.
                </p>

                {/* Go Home button (Dashboard) */}
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 
                     text-zinc-100 font-medium transition-colors shadow-lg"
                >
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
}
