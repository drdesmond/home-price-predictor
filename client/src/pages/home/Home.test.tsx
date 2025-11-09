import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './Home';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HomePage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    it('renders the home view content', () => {
        render(<HomePage />);
        expect(screen.getByRole('heading', { name: /property estimator/i })).toBeInTheDocument();
        expect(screen.getByText(/instantly estimate property price/i)).toBeInTheDocument();
    });

    it('navigates when buttons are clicked', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        await user.click(screen.getByRole('button', { name: /start estimating/i }));
        await user.click(screen.getByRole('button', { name: /view previous predictions/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/estimate');
        expect(mockNavigate).toHaveBeenCalledWith('/history');
    });
});

