import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import History from './History';

const samplePrediction = {
    id: '1',
    square_footage: 2500,
    bedrooms: 4,
    predicted_price: 523450.75,
    created_at: '2025-01-01T12:00:00.000Z',
};

describe('History', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading indicator when history is loading', () => {
        render(<History predictionsList={[]} historyLoading historyError={null} fetchHistory={vi.fn()} onBack={vi.fn()} />);

        expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    });

    it('shows an error message when provided', () => {
        render(<History predictionsList={[]} historyLoading={false} historyError="Something went wrong" fetchHistory={vi.fn()} onBack={vi.fn()} />);

        expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });

    it('renders prediction rows and triggers actions', async () => {
        const fetchHistory = vi.fn();
        const onBack = vi.fn();
        const user = userEvent.setup();
        const toLocaleSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Jan 1, 2025, 12:00 PM');

        render(<History predictionsList={[samplePrediction]} historyLoading={false} historyError={null} fetchHistory={fetchHistory} onBack={onBack} />);

        expect(screen.getByText('Jan 1, 2025, 12:00 PM')).toBeInTheDocument();
        expect(screen.getByText(/2500 ft²/i)).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument();
        expect(screen.getByText(/\$/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /← back/i }));
        await user.click(screen.getByRole('button', { name: /refresh/i }));

        expect(onBack).toHaveBeenCalledTimes(1);
        expect(fetchHistory).toHaveBeenCalledTimes(1);

        toLocaleSpy.mockRestore();
    });
});
