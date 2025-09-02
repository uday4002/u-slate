"use client";

import { useState, useEffect } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import emailjs from "@emailjs/browser";

// Type for the contact form state
interface ContactForm {
    name: string;
    email: string;
    message: string;
}

const ContactPage = () => {
    const [form, setForm] = useState<ContactForm>({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<string>("");
    const [mounted, setMounted] = useState<boolean>(false);

    // Ensure there is no SSR/client mismatch
    useEffect(() => setMounted(true), []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("Sending...");

        const templateParams = {
            from_name: form.name,
            reply_to: form.email,
            message: form.message,
        };

        try {
            await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
                templateParams,
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
            );
            setStatus("Message sent! ✅");
            setForm({ name: "", email: "", message: "" });

            // Clear status after 3 seconds
            setTimeout(() => setStatus(""), 3000);
        } catch (err) {
            console.error("Email send error:", err);
            setStatus("Failed to send ❌");

            setTimeout(() => setStatus(""), 3000);
        }
    };

    if (!mounted) return null; // Prevent SSR/client mismatch

    return (
        <section
            className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center bg-zinc-950 text-white min-h-[calc(100vh-150px)] mt-10"
        >
            <h1 className="text-xl sm:text-3xl md:text-5xl font-bold mb-4 text-center">
                Contact Us
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-300 mb-8 text-center">
                Have questions, feedback, or ideas? Reach out and we'll respond as soon as possible!
            </p>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg border-zinc-800 shadow-md rounded-lg p-4 sm:p-6 md:p-8 grid gap-4 bg-zinc-900"
            >
                <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full text-white border-zinc-700 bg-zinc-800 p-2 sm:p-3 rounded-lg focus:ring-2 focus:outline-none text-sm sm:text-base"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full text-white border-zinc-700 bg-zinc-800 p-2 sm:p-3 rounded-lg focus:ring-2 focus:outline-none text-sm sm:text-base"
                    required
                />
                <textarea
                    name="message"
                    placeholder="Your Message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full text-white border-zinc-700 bg-zinc-800 p-2 sm:p-3 rounded-lg focus:ring-2 focus:outline-none text-sm sm:text-base"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base cursor-pointer"
                >
                    Send Message
                </button>
                {status && (
                    <p className={`text-left mt-2 h-6 text-sm sm:text-base 
                        ${status.includes("✅") ? "text-green-400" : "text-red-400"}`
                    }>
                        {status}
                    </p>
                )}
            </form>

            {/* Contact Info */}
            <div className="mt-6 sm:mt-8 text-center text-zinc-300 space-y-2 text-sm sm:text-base">
                <p>
                    Email:{" "}
                    <a
                        href="mailto:uslate957@gmail.com"
                        className="text-blue-400 hover:text-blue-500 transition"
                    >
                        uslate957@gmail.com
                    </a>
                </p>
                <p>
                    Phone:{" "}
                    <a
                        href="tel:+919010884436"
                        className="text-blue-400 hover:text-blue-500 transition"
                    >
                        +91 9010884436
                    </a>
                </p>
            </div>

            {/* Social Links */}
            <div className="mt-4 sm:mt-6 flex justify-center space-x-4 sm:space-x-6 text-xl sm:text-2xl">
                <a
                    href="https://github.com/uday4002"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600 transition"
                >
                    <FaGithub />
                </a>
                <a
                    href="https://www.linkedin.com/in/udaykiranbudda/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600 transition"
                >
                    <FaLinkedin />
                </a>
            </div>
        </section>
    );
};

export default ContactPage;