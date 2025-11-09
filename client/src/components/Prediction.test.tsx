import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PredictionResponse } from '../types/predictions';
import Prediction from './Prediction';

const baseResult: PredictionResponse = {
    predicted_price: 312345.678,
    square_footage: 2200,
    bedrooms: 4,
};

describe('Prediction', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the prediction form with initial values', () => {
        const onSubmit = vi.fn();
        const onBack = vi.fn();

        render(<Prediction loading={false} result={null} error={null} onSubmit={onSubmit} onBack={onBack} initialValues={{ sqft: 1500, bedrooms: 3 }} />);

        expect(screen.getByLabelText(/square footage/i)).toHaveValue(1500);
        expect(screen.getByLabelText(/number of bedrooms/i)).toHaveValue(3);
        expect(screen.getByRole('button', { name: /estimate price/i })).toBeEnabled();
    });

    it('submits sanitized values and renders the latest result', async () => {
        const onSubmit = vi.fn();
        const onBack = vi.fn();
        const user = userEvent.setup();

        render(<Prediction loading={false} result={baseResult} error={null} onSubmit={onSubmit} onBack={onBack} />);

        const sqftField = screen.getByLabelText(/square footage/i);
        const bedroomField = screen.getByLabelText(/number of bedrooms/i);

        await user.clear(sqftField);
        await user.type(sqftField, '2000');

        await user.clear(bedroomField);
        await user.type(bedroomField, '4');

        await user.click(screen.getByRole('button', { name: /estimate price/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        const submittedPayload = onSubmit.mock.calls[0]?.[0];
        expect(submittedPayload).toBeTruthy();
        expect(Number(submittedPayload?.sqft)).toBe(2000);
        expect(Number(submittedPayload?.bedrooms)).toBe(4);

        expect(screen.getByText('Predicted Price: $312345.68')).toBeInTheDocument();
        expect(screen.getByText(/2200 sqft/i)).toBeInTheDocument();
    });

    it('invokes the back handler when the back button is clicked', async () => {
        const onSubmit = vi.fn();
        const onBack = vi.fn();
        const user = userEvent.setup();

        render(<Prediction loading={false} result={null} error={null} onSubmit={onSubmit} onBack={onBack} />);

        await user.click(screen.getByRole('button', { name: /back/i }));

        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
