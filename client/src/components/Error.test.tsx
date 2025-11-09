import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Error from './Error';

describe('Error', () => {
    it('returns null when there is no error message', () => {
        const { container } = render(<Error error={undefined} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the provided error message', () => {
        render(<Error error="Could not fetch data" />);
        expect(screen.getByRole('alert')).toHaveTextContent('Could not fetch data');
    });
});
