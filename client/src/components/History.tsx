import { useMemo } from 'react';

export type HistoryPrediction = {
    id: string | number;
    square_footage: number;
    bedrooms: number;
    predicted_price: number;
    created_at: string;
};

type HistoryProps = {
    predictionsList: HistoryPrediction[];
    historyLoading: boolean;
    historyError?: string | null;
    fetchHistory: () => void;
    onBack: () => void;
};

export default function History({ predictionsList, historyLoading, historyError, fetchHistory, onBack }: HistoryProps) {
    const renderTableBody = useMemo(
        () =>
            predictionsList.map(prediction => (
                <tr key={prediction.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-600">{new Date(prediction.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-800">{prediction.square_footage} ft²</td>
                    <td className="px-6 py-4 text-slate-800">{prediction.bedrooms}</td>
                    <td className="px-6 py-4 text-indigo-600 font-semibold">${Number(prediction.predicted_price)?.toFixed(2)?.toLocaleString()}</td>
                </tr>
            )),
        [predictionsList],
    );

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-sky-50 to-white flex flex-col animate-fadeIn">
            <header className="flex justify-between items-center px-8 py-6 border-b bg-white/80 backdrop-blur-sm shadow">
                <button onClick={onBack} className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                    ← Back
                </button>
                <h1 className="text-2xl font-semibold text-slate-800">Prediction History</h1>
                <button onClick={fetchHistory} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium" type="button">
                    Refresh
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-10">
                {historyLoading ? (
                    <div className="text-center text-slate-500 mt-20 text-lg" role="status">
                        Loading…
                    </div>
                ) : historyError ? (
                    <div className="text-center text-red-600 mt-20" role="alert">
                        {historyError}
                    </div>
                ) : predictionsList.length === 0 ? (
                    <div className="text-center text-slate-500 mt-20">No predictions yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left shadow-sm">
                            <thead className="bg-slate-100 text-slate-700 text-sm uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3 border-b">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 border-b">
                                        Square Footage
                                    </th>
                                    <th scope="col" className="px-6 py-3 border-b">
                                        Bedrooms
                                    </th>
                                    <th scope="col" className="px-6 py-3 border-b">
                                        Predicted Price
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">{renderTableBody}</tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
