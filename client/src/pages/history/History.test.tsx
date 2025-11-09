import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryPage from './History';

const mockNavigate = vi.fn();
const mockFetch = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HistoryPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockFetch.mockReset();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches history on mount and renders results', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                predictions: [
                    {
                        id: '1',
                        square_footage: 1500,
                        bedrooms: 2,
                        predicted_price: 320000,
                        created_at: '2025-01-02T12:00:00.000Z',
                    },
                ],
            }),
        });

        render(<HistoryPage />);

        expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        expect(await screen.findByText(/1500 ft²/)).toBeInTheDocument();
    });

    it('shows error message and allows retry', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Server down' }),
        });

        const user = userEvent.setup();
        render(<HistoryPage />);

        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        expect(await screen.findByRole('alert')).toHaveTextContent('Server down');

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ predictions: [] }),
        });

        await user.click(screen.getByRole('button', { name: /refresh/i }));
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    });
});

