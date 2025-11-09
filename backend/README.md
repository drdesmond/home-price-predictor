# Backend (NestJS API)

This service sits between the React client and the ML model. It validates requests, fetches price predictions, and persists the results to a local SQLite database for the history page. If the Flask API is unavailable it automatically falls back to the pretrained ONNX model in `backend/src/models`.

- **backend/** – NestJS API (port 3001)

## Core flow

- `PredictionController` exposes `POST /predictions` and `GET /predictions`.
- `PredictionService` calls the Flask model at `http://127.0.0.1:5000/predict` (see `prediction.service.ts`) and saves the response through TypeORM.
- Predictions are stored in `predictions.db` as `Prediction` entities (square footage, bedrooms, predicted price, timestamps).

## Getting started

```bash
cd backend
npm install
npm run start:dev
```

The API listens on `http://127.0.0.1:3001`. Update the `MODEL_URL` constant in `prediction.service.ts` if your ML endpoint lives elsewhere. A production build is available via `npm run build && npm run start:prod`.

## Troubleshooting

- **`sqlite3` fails to build** – install Xcode Command Line Tools (macOS) and run `npm rebuild sqlite3 --build-from-source`.
- **`POST /predictions` returns 502/504** – make sure the Flask ML service is reachable at the configured `MODEL_URL`. When it isn’t, the controller switches to the bundled ONNX model so requests still succeed.\*\*\* End Patch
- **Database not updating** – delete `predictions.db` and restart; TypeORM will recreate the schema on boot.\*\*\*
