import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Prediction, { type PredictionFormValues } from '../../components/Prediction';
import type { PredictionResponse } from '../../types/predictions';
import { API_BASE_URL, JSON_HEADERS } from '../../lib/api';

const predictUrl = `${API_BASE_URL}/predictions`;

export default function EstimatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (values: PredictionFormValues) => {
        setError(null);
        setResult(null);
        setLoading(true);

        try {
            const response = await fetch(predictUrl, {
                method: 'POST',
                headers: JSON_HEADERS,
                body: JSON.stringify({
                    square_footage: values.sqft,
                    bedrooms: values.bedrooms,
                }),
            });

            const payload = (await response.json()) as PredictionResponse & { error?: string };
            if (!response.ok) {
                setError(payload.error ?? 'Request failed');
            } else {
                setResult(payload);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 flex flex-col items-center justify-center text-slate-800 p-6 transition-all">
            <Prediction loading={loading} result={result} error={error} onBack={() => navigate('/')} onSubmit={handleSubmit} />
        </div>
    );
}
