export default function AboutPage() {
    return (
        <section className="max-w-5xl mx-auto px-4 pt-10 sm:py-20 bg-zinc-950 text-white min-h-[calc(100vh-150px)] mb-6">
            {/* Page Heading */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
                About U-slate
            </h1>

            {/* Introduction */}
            <p className="text-zinc-300 text-base sm:text-lg mb-6 text-center">
                U-slate is a comprehensive life organizer designed specifically for college students.
                It helps you manage your academic, personal, and professional life efficiently — all from a single, easy-to-use dashboard.
                With U-slate, you can stay organized, track progress, and achieve your goals with minimal stress.
            </p>

            {/* Features Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
                {/* Tasks */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Tasks</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Create and manage your daily or weekly tasks with duedates so you never miss deadlines.
                        This helps you stay productive and organized.
                    </p>
                </div>

                {/* Budget */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Budget</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Track your monthly finances, manage expenses, and plan your budget efficiently.
                        U-slate gives you a clear view of your financial health.
                    </p>
                </div>

                {/* Learning Habit */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Learning Habit</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Build consistent learning habits by setting goals like “Solve 1 DSA problem daily” or “Read 10 pages of a book.”
                        Track your progress, earn XP, and stay motivated to grow every day.
                    </p>
                </div>

                {/* Projects */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Projects</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Store information about your academic or personal projects, including live URLs and description.
                        Keep your portfolio organized and easily accessible.
                    </p>
                </div>

                {/* Certifications */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Certifications</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Store and organize your certificates with live URLs so you can showcase your achievements.
                        Access them anytime from your dashboard for academic or professional purposes.
                    </p>
                </div>

                {/* Journal */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Journal</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Maintain a daily reflection journal for personal writing, self-growth, or documenting experiences.
                        This feature encourages mindfulness and consistency.
                    </p>
                </div>

                {/* Profiles */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Profiles</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Save links and user IDs of platforms like GitHub, LeetCode, LinkedIn, and HackerRank.
                        Access all your professional profiles in one place.
                    </p>
                </div>
            </div>
        </section>
    );
}
