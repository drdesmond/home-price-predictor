import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home';

describe('Home', () => {
    it('renders headline and description', () => {
        render(<Home onStart={vi.fn()} onHistory={vi.fn()} />);

        expect(screen.getByRole('heading', { name: /property estimator/i })).toBeInTheDocument();
        expect(screen.getByText(/instantly estimate property price/i)).toBeInTheDocument();
    });

    it('invokes callbacks when actions are clicked', async () => {
        const onStart = vi.fn();
        const onHistory = vi.fn();
        const user = userEvent.setup();

        render(<Home onStart={onStart} onHistory={onHistory} />);

        await user.click(screen.getByRole('button', { name: /start estimating/i }));
        await user.click(screen.getByRole('button', { name: /view previous predictions/i }));

        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onHistory).toHaveBeenCalledTimes(1);
    });
});

