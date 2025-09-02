const Footer = () => {
    return (
        <footer className="bg-[#333] py-4 mt-2 max-h-[64px]">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm sm:text-lg text-white">
                © {new Date().getFullYear()} U-slate. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
