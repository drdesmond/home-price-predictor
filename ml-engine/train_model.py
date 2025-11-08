#!/usr/bin/env python3
"""
Utility script for training the house price prediction model.

The resulting model is stored alongside the Flask service so the API can load it
without retraining on startup. By default the script uses the sample dataset, 
but a custom CSV file can be supplied.
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Iterable, Optional

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

try:
    from xgboost import XGBRegressor
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "xgboost is required for training. Install it with `pip install xgboost`."
    ) from exc

try:
    from onnxmltools.convert import convert_xgboost
    from skl2onnx.common.data_types import FloatTensorType
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "onnxmltools and skl2onnx are required for ONNX export. "
        "Install them with `pip install onnxmltools skl2onnx`."
    ) from exc


# module-level logger for consistent output format
LOGGER = logging.getLogger("train_model")

# derive default output relative to this file so the model lives next to the API
ROOT = Path(__file__).resolve().parent
DEFAULT_OUTPUT_PATH = ROOT / "models" / "house_price_model.pkl"
# secondary directory, shared at repo root for other services
SECONDARY_MODEL_DIR = ROOT.parent / "backend" / "src" / "models"
# create the directory if it doesn't exist
SECONDARY_MODEL_DIR.mkdir(parents=True, exist_ok=True)

# column names expected in both sample data and custom datasets
FEATURE_COLUMNS = ["Square Footage", "Number of Bedrooms"]
TARGET_COLUMN = "Price"
TARGET_ALIASES = [TARGET_COLUMN, "Price ($)", "price", "price ($)"]

# bundled sample data from the take-home brief used when no CSV is supplied
DEFAULT_DATA = pd.DataFrame(
    [
        {"Square Footage": 800, "Number of Bedrooms": 2, "Price": 150000},
        {"Square Footage": 1200, "Number of Bedrooms": 3, "Price": 200000},
        {"Square Footage": 1500, "Number of Bedrooms": 3, "Price": 250000},
        {"Square Footage": 1800, "Number of Bedrooms": 4, "Price": 300000},
        {"Square Footage": 2000, "Number of Bedrooms": 4, "Price": 320000},
        {"Square Footage": 2200, "Number of Bedrooms": 5, "Price": 360000},
        {"Square Footage": 2400, "Number of Bedrooms": 4, "Price": 380000},
        {"Square Footage": 2600, "Number of Bedrooms": 5, "Price": 400000},
    ],
)


def parse_args(args: Optional[Iterable[str]] = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Train the house price regression model."
    )
    parser.add_argument(
        "--data",
        type=Path,
        help=(
            "Optional path to a CSV file containing training data. "
            "The file must include columns: "
            f"{', '.join([*FEATURE_COLUMNS, TARGET_COLUMN])}."
        ),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"Location to store the trained model (default: {DEFAULT_OUTPUT_PATH}).",
    )
    parser.add_argument(
        "--silent",
        action="store_true",
        help="Suppress informational logging output.",
    )
    return parser.parse_args(args)


def configure_logging(silent: bool) -> None:
    """Configure module-level logging."""
    level = logging.WARNING if silent else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")


def load_dataset(path: Optional[Path]) -> pd.DataFrame:
    """
    Load the training dataset from a CSV file or fall back to the bundled sample data.
    """
    if path is None:
        LOGGER.info("No dataset supplied; using bundled sample data.")
        return DEFAULT_DATA.copy()

    if not path.exists():
        raise FileNotFoundError(f"Training data file not found: {path}")

    dataset = pd.read_csv(path)

    # normalise target column name if supplied with an alias
    target_column = next(
        (alias for alias in TARGET_ALIASES if alias in dataset.columns),
        None,
    )
    if target_column is None:
        raise ValueError(
            f"Dataset is missing required target column. Expected one of: {', '.join(TARGET_ALIASES)}"
        )
    if target_column != TARGET_COLUMN:
        dataset = dataset.rename(columns={target_column: TARGET_COLUMN})

    # ensure required columns exist before training
    missing_columns = [col for col in FEATURE_COLUMNS if col not in dataset.columns]
    if missing_columns:
        raise ValueError(
            f"Dataset is missing required columns: {', '.join(missing_columns)}"
        )

    LOGGER.info("Loaded dataset from %s with %d rows.", path, len(dataset))
    return dataset


def train_regressor(dataset: pd.DataFrame) -> XGBRegressor:
    """
    Train and return an XGBoost regressor for predicting house prices.
    """
    X = dataset[FEATURE_COLUMNS].to_numpy()
    y = dataset[TARGET_COLUMN].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        random_state=42,
        objective="reg:squarederror",
    )
    model.fit(X_train, y_train)
    # ensure feature names are compatible with ONNX conversion (f0, f1, ...)
    booster = model.get_booster()
    booster.feature_names = [f"f{i}" for i in range(len(FEATURE_COLUMNS))]
    booster.feature_types = ["float" for _ in FEATURE_COLUMNS]

    train_predictions = model.predict(X_train)
    train_mae = mean_absolute_error(y_train, train_predictions)
    train_rmse = mean_squared_error(y_train, train_predictions, squared=False)
    train_r2 = r2_score(y_train, train_predictions)
    LOGGER.info(
        "Training (fit) metrics: MAE=%.2f, RMSE=%.2f, R^2=%.4f",
        train_mae,
        train_rmse,
        train_r2,
    )

    if len(y_test) == 0:
        LOGGER.warning("Test split is empty; evaluation metrics will be skipped.")
    else:
        predictions = model.predict(X_test)
        mae = mean_absolute_error(y_test, predictions)
        rmse = mean_squared_error(y_test, predictions, squared=False)
        r2 = r2_score(y_test, predictions)
        LOGGER.info("Evaluation (test set): MAE=%.2f, RMSE=%.2f, R^2=%.4f", mae, rmse, r2)

    LOGGER.info("Training complete on %d samples.", len(dataset))

    return model


def save_artifacts(model: XGBRegressor, destination: Path) -> None:
    """Persist the trained model artifacts (pickle + ONNX) to disk."""
    save_pickle(model, destination)
    save_pickle(model, SECONDARY_MODEL_DIR / destination.name)

    onnx_destination = destination.with_suffix(".onnx")
    save_onnx(model, onnx_destination)
    save_onnx(model, SECONDARY_MODEL_DIR / onnx_destination.name)


def save_pickle(model: XGBRegressor, destination: Path) -> None:
    if destination.exists():
        LOGGER.info("Existing model at %s will be overwritten.", destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, destination)
    LOGGER.info("Pickle model saved to %s", destination)


def save_onnx(model: XGBRegressor, destination: Path) -> None:
    if destination.exists():
        LOGGER.info("Existing ONNX model at %s will be overwritten.", destination)
    destination.parent.mkdir(parents=True, exist_ok=True)

    initial_types = [
        ("input", FloatTensorType([None, len(FEATURE_COLUMNS)])),
    ]
    onnx_model = convert_xgboost(model.get_booster(), initial_types=initial_types)
    with destination.open("wb") as model_file:
        model_file.write(onnx_model.SerializeToString())
    LOGGER.info("ONNX model saved to %s", destination)


def main(argv: Optional[Iterable[str]] = None) -> None:
    """CLI entrypoint."""
    args = parse_args(argv)
    configure_logging(args.silent)

    dataset = load_dataset(args.data)
    pipeline = train_regressor(dataset)
    save_artifacts(pipeline, args.output)


if __name__ == "__main__":
    main()

