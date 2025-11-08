import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home/Home';
import Estimate from './pages/estimate/Estimate';
import History from './pages/history/History';
import NotFound from './pages/notfound/Notfound';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/estimate" element={<Estimate />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
