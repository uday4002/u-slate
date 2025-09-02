export default function Spinner() {
    return (
        <div className="flex flex-col items-center justify-center text-center w-full h-full mt-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-t-red-600 border-b-red-600 border-l-transparent border-r-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 text-sm sm:text-base">Loading...</p>
        </div>
    )
}
