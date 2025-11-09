import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './Notfound';

describe('NotFoundPage', () => {
    it('displays the 404 message', () => {
        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
        expect(screen.getByText(/doesn’t exist/i)).toBeInTheDocument();
    });

    it('renders a link back home', () => {
        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>,
        );

        const link = screen.getByRole('link', { name: /go back home/i });
        expect(link).toHaveAttribute('href', '/');
    });
});

