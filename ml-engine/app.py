"""
Flask Backend - Prediction Service Only
This service handles ML model predictions only.
Database operations are handled by NestJS backend.
"""
import logging
import warnings
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
from pathlib import Path
try:
    from sklearn.base import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except Exception:
    pass

app = Flask(__name__)
CORS(app)  # Enable CORS for NestJS backend
logging.basicConfig(level=logging.INFO)

# Load ML model
model = None
ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "models" / "house_price_model.pkl"
try:
    model = joblib.load(str(MODEL_PATH))
    app.logger.info("Model loaded successfully from: %s", MODEL_PATH)
except Exception as e:
    app.logger.error("Failed to load model: %s", e)
    model = None

@app.route("/predict", methods=["POST"])
def predict_price():
    """
    Prediction endpoint - Returns property price prediction only.
    Database storage is handled by NestJS backend.
    """
    try:
        # Require JSON payload
        data = request.get_json(silent=True)
        if not data:
            msg = (
                "Invalid request: expected JSON body. "
                "POST JSON with Content-Type: application/json, e.g. {\"square_footage\":2000, \"bedrooms\":4}"
            )
            app.logger.warning(msg)
            return jsonify({"error": msg}), 400

        # helper to accept common key names
        def get_field(d, *keys):
            for k in keys:
                if k in d and d[k] is not None and str(d[k]).strip() != "":
                    return d[k]
            return None

        square_raw = get_field(data, "square_footage", "sqft", "Square Footage", "squareFootage")
        beds_raw = get_field(data, "bedrooms", "beds", "Number of Bedrooms", "bedroom")

        if square_raw is None or beds_raw is None:
            msg = "Please provide both square_footage (or sqft) and bedrooms (or beds) in JSON body."
            app.logger.warning("Missing fields: %s", data)
            return jsonify({"error": msg, "received": data}), 400

        try:
            square_footage = float(square_raw)
        except Exception:
            return jsonify({"error": "square_footage must be a number"}), 400

        try:
            bedrooms = int(float(beds_raw))
        except Exception:
            return jsonify({"error": "bedrooms must be an integer"}), 400

        if model is None:
            app.logger.error("Prediction requested but model not loaded.")
            return jsonify({"error": "Model not loaded on server"}), 500

        # Prepare data for model prediction
        feature_names = None
        try:
            feature_names = model.get_booster().feature_names
        except Exception:
            feature_names = getattr(model, "feature_names_in_", None)

        if feature_names:
            new_data = pd.DataFrame([[square_footage, bedrooms]], columns=feature_names)
        else:
            new_data = pd.DataFrame(
                [[square_footage, bedrooms]],
                columns=["Square Footage", "Number of Bedrooms"]
            )

        try:
            predicted_price = model.predict(new_data)[0]
        except Exception as e:
            app.logger.exception("Model prediction failed")
            return jsonify({"error": "Model prediction failed", "details": str(e)}), 500

        app.logger.info("Prediction: sqft=%s beds=%s price=%s", 
                       square_footage, bedrooms, float(predicted_price))

        # Return prediction only - NestJS will handle database storage
        return jsonify({
            "square_footage": square_footage,
            "bedrooms": bedrooms,
            "predicted_price": round(float(predicted_price), 2)
        })

    except Exception as e:
        app.logger.exception("Unhandled error in /predict")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
