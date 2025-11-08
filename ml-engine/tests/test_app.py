import sys
from pathlib import Path
from unittest.mock import patch

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import app


@pytest.fixture()
def client():
    return app.test_client()


def test_predict_returns_successful_response(client):
    fake_prediction = 275000.0
    with patch("app.model") as model_mock:
        model_mock.predict.return_value = [fake_prediction]
        response = client.post(
            "/predict",
            json={"square_footage": 1500, "bedrooms": 3},
        )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload == {
        "square_footage": 1500.0,
        "bedrooms": 3,
        "predicted_price": round(fake_prediction, 2),
    }


def test_predict_validates_payload(client):
    response = client.post("/predict", json={"square_footage": 1500})
    assert response.status_code == 400
    payload = response.get_json()
    assert "error" in payload

