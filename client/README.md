# React Client

Frontend for the Property Estimator experience. It renders the home/start/history flows, validates user input, and talks to the NestJS API.

## Core pieces

-   `src/pages/` wraps the UI into route-level components (`home`, `estimate`, `history`, `notfound`).
-   `src/components/Prediction.tsx` uses `react-hook-form` + `yup` to validate square footage/bedrooms before calling the API.
-   `src/lib/api.ts` centralises the backend URL (`http://127.0.0.1:3001` by default) and payload helpers.

## Getting started

```bash
cd client
npm install
npm run dev
```

Open http://127.0.0.1:5173 to use the UI. Component and page tests run with:

```bash
npm test -- --run
```

## Troubleshooting

-   **Blank screen / 404** – ensure `npm run dev` is still running and the browser points to the Vite port (5173).
-   **Form submits but history is empty** – verify the backend (`npm run start:dev` in `/backend`) is up and reachable.
-   **TypeScript errors about `vitest` globals** – run `npm install` to ensure the shared test tooling is installed.\*\*\*
