import Link from "next/link";

export default function HomePage() {
    return (
        <section className="max-w-5xl mx-auto flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center px-4 mt-10 bg-zinc-950 text-white">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
                Organize Your College Life with U-slate
            </h1>
            <p className="text-1.5xl sm:text-lg md:text-xl text-zinc-300 mb-8">
                Manage tasks, budgets, Learning Habits, projects, Certifications and Journals all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-auto">
                <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Get Started
                </Link>
                <Link
                    href="/about"
                    className="bg-zinc-800 text-white px-6 py-3 rounded-lg hover:bg-zinc-700 transition"
                >
                    Learn More
                </Link>
            </div>
        </section>
    );
}