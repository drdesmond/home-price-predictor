type HomeProps = {
    onStart: () => void;
    onHistory: () => void;
};

export default function Home({ onStart, onHistory }: HomeProps) {
    return (
        <div className="text-center animate-fadeIn">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-700 to-sky-600 bg-clip-text text-transparent mb-4">Property Estimator</h1>
            <p className="text-slate-600 text-lg mb-8">Instantly estimate property price using square footage and bedrooms.</p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <button
                    onClick={onStart}
                    className="px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow-lg hover:scale-[1.03] transition"
                >
                    Start Estimating
                </button>
                <button
                    onClick={onHistory}
                    className="px-6 py-3 text-lg rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold shadow hover:bg-slate-50 transition"
                >
                    View Previous Predictions
                </button>
            </div>
        </div>
    );
}
