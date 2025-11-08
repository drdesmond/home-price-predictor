type ErrorProps = {
    error?: string;
};

export default function Error({ error }: ErrorProps) {
    if (!error) return null;
    return (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 w-full" role="alert">
            {error}
        </div>
    );
}
