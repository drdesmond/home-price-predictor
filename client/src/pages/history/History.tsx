import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryView, { type HistoryPrediction } from '../../components/History';
import { API_BASE_URL, HISTORY_FETCH_LIMIT } from '../../lib/api';

const historyUrl = `${API_BASE_URL}/predictions?limit=${HISTORY_FETCH_LIMIT}`;

export default function HistoryPage() {
    const navigate = useNavigate();
    const [predictionsList, setPredictionsList] = useState<HistoryPrediction[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setHistoryError(null);
        setHistoryLoading(true);

        try {
            const response = await fetch(historyUrl);
            const payload = await response.json();
            if (!response.ok) {
                setHistoryError(payload.error ?? 'Failed to fetch history');
                setPredictionsList([]);
            } else {
                setPredictionsList(payload.predictions ?? []);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setHistoryError(message || 'Network error');
            setPredictionsList([]);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchHistory();
    }, [fetchHistory]);

    return (
        <HistoryView
            predictionsList={predictionsList}
            historyLoading={historyLoading}
            historyError={historyError}
            fetchHistory={fetchHistory}
            onBack={() => navigate('/')}
        />
    );
}
