import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EstimatePage from './Estimate';

const mockNavigate = vi.fn();
const mockFetch = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('EstimatePage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockFetch.mockReset();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('submits the form and displays the prediction result on success', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                predicted_price: 250000,
                square_footage: 2000,
                bedrooms: 3,
            }),
        });

        const user = userEvent.setup();
        render(<EstimatePage />);

        await user.type(screen.getByLabelText(/square footage/i), '2000');
        await user.type(screen.getByLabelText(/number of bedrooms/i), '3');
        await user.click(screen.getByRole('button', { name: /estimate price/i }));

        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/predictions$/), expect.objectContaining({ method: 'POST' }));
        expect(await screen.findByText(/Predicted Price: \$250000\.00/)).toBeInTheDocument();
    });

    it('shows an error when the API returns an error response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                error: 'Invalid data',
            }),
        });

        const user = userEvent.setup();
        render(<EstimatePage />);

        await user.type(screen.getByLabelText(/square footage/i), '100');
        await user.type(screen.getByLabelText(/number of bedrooms/i), '1');
        await user.click(screen.getByRole('button', { name: /estimate price/i }));

        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        expect(await screen.findByRole('alert')).toHaveTextContent('Invalid data');
    });
});

