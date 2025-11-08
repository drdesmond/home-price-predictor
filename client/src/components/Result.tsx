import type { PredictionResponse } from '../types/predictions';

type ResultProps = {
    result?: PredictionResponse | null;
};

export default function Result({ result }: ResultProps) {
    if (!result) return null;
    return (
        <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-center w-full" aria-live="polite">
            <p className="text-lg font-semibold">Predicted Price: ${result.predicted_price.toFixed(2)}</p>
            <p className="text-sm text-slate-600 mt-1">
                {result.square_footage} sqft • {result.bedrooms} bedrooms
            </p>
        </div>
    );
}
