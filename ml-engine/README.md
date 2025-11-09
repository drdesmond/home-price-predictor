# ML Engine (Flask)

Lightweight Flask service that turns a trained model into a `/predict` endpoint for the Property Estimator stack. When this API is offline, the backend automatically switches to the pretrained ONNX model in `backend/src/models`. Start Flask server and set env (MODEL_URL=http://127.0.0.1:5000) if you want live predictions; otherwise you can continue with just the client and backend.

## Core flow

-   `app.py` deserialises `models/house_price_model.pkl` with `joblib` on startup.
-   Incoming `POST /predict` requests expect `square_footage` and `bedrooms` (aliases like `sqft`/`beds` are accepted).
-   The request is converted into a Pandas dataframe and passed to the model. Only the prediction is returned; persistence happens in the NestJS API.

## Getting started

```bash
cd ml-engine
python3 -m venv .venv
source .venv/bin/activate  # .venv\Scripts\activate on Windows
pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

The service listens on http://127.0.0.1:5000/predict. Unit tests live under `tests/`:

```bash
pytest
```

## Troubleshooting

-   **`Model not loaded` errors** – ensure `models/house_price_model.pkl` exists. Re-run `python train_model.py` to regenerate it if needed.
-   **Import failures (onnx, sklearn, etc.)** – confirm the virtual environment is active and `pip install -r requirements.txt` completed successfully.
-   **CORS or connection errors from the backend** – verify Flask is running on port 5000 (or adjust the NestJS `MODEL_URL` constant to match your host/port).\*\*\*
