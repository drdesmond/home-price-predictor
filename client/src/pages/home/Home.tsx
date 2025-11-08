import { useNavigate } from 'react-router-dom';
import HomeView from '../../components/Home';

export default function HomePage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 flex flex-col items-center justify-center text-slate-800 p-6 transition-all">
            <HomeView onStart={() => navigate('/estimate')} onHistory={() => navigate('/history')} />
        </div>
    );
}
