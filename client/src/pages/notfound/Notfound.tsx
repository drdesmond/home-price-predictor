import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 flex flex-col items-center justify-center text-slate-800 p-6 transition-all">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-slate-800 mb-4">404</h1>
                <p className="text-slate-600 mb-6">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
                <Link
                    to="/"
                    className="px-6 py-3 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:scale-[1.02] transition"
                >
                    Go back home
                </Link>
            </div>
        </div>
    );
}
