import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Result from './Result';

describe('Result', () => {
    it('returns null when result is not provided', () => {
        const { container } = render(<Result result={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows the formatted prediction result', () => {
        render(
            <Result
                result={{
                    predicted_price: 456789.123,
                    square_footage: 1800,
                    bedrooms: 3,
                }}
            />,
        );

        expect(screen.getByText('Predicted Price: $456789.12')).toBeInTheDocument();
        expect(screen.getByText(/1800 sqft/i)).toBeInTheDocument();
        expect(screen.getByText(/3 bedrooms/i)).toBeInTheDocument();
    });
});

