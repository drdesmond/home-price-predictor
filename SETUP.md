# 🏡 Property Estimator – Local Setup Guide

This guide walks through everything a reviewer needs to run the React client, NestJS API, and Flask ML engine locally. It covers prerequisites, environment configuration, installation steps, and helpful troubleshooting tips.

---

## 1. Prerequisites

| Tool                             | Recommended Version         | Notes                                                                |
| -------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Node.js                          | 20.x LTS                    | Required for the NestJS backend and React client.                    |
| npm                              | 10.x (bundled with Node 20) | pnpm/yarn work too, but the repo ships with `package-lock.json`.     |
| Python                           | 3.10 – 3.13                 | Used for the ML engine and training script.                          |
| pip                              | Latest                      | Install packages listed in `ml-engine/requirements.txt`.             |
| Git                              | Latest                      | To clone the repository.                                             |
| Xcode Command Line Tools (macOS) | —                           | Needed if you have to rebuild native Node modules such as `sqlite3`. |

> **Tip:** On macOS you can install command line tools with `xcode-select --install`.

---

## 2. Clone the Repository

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd GEVITY
```

The repo contains three active services:

```
GEVITY/
├── backend/      # NestJS API (port 3001)
├── client/       # React UI (port 5173)
└── ml-engine/    # Flask ML service + training utilities (port 5000)
```

---

## 3. Configure Environment Variables

Only the NestJS backend requires configuration. Create `backend/.env`:

```bash
PORT=3001
# When defined, NestJS forwards prediction requests to the Flask service.
# Leave undefined to use the bundled local ONNX model.
MODEL_URL=http://127.0.0.1:5000

# Optional: override the location of the local ONNX model.
# MODEL_PATH=/absolute/path/to/house_price_model.onnx
```

If `MODEL_URL` is omitted, NestJS falls back to the ONNX file at `backend/src/models/house_price_model.onnx`.

---

## 4. ML Engine (Flask) Setup

1. **Create and activate a virtual environment**

    ```bash
    cd ml-engine
    python3 -m venv .venv
    source .venv/bin/activate        # macOS/Linux
    # .venv\Scripts\activate.ps1     # PowerShell on Windows
    ```

2. **Install dependencies**

    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```

3. **(Optional) Train the model**

    ```bash
    python train_model.py
    # or supply custom data
    python train_model.py --data /path/to/data.csv
    ```

    Training exports both `house_price_model.pkl` and `house_price_model.onnx` to:

    - `ml-engine/models/`
    - `backend/src/models/`

4. **Run unit tests**

    ```bash
    pytest
    ```

5. **Start the Flask API**

    ```bash
    python app.py
    ```

    The service listens on `http://127.0.0.1:5000/predict`.

---

## 5. NestJS Backend Setup

1. **Install dependencies**

    ```bash
    cd backend
    npm install
    ```

    > **macOS/Apple silicon:** if `sqlite3` fails to install, run:
    >
    > ```bash
    > npm rebuild sqlite3 --build-from-source
    > ```

2. **Start the API (watch mode)**

    ```bash
    npm run start:dev
    ```

    The API listens on `http://127.0.0.1:3001`. Key endpoints:

    - `POST /predictions` — proxies to Flask or uses the local ONNX model.
    - `GET /predictions?limit=100` — returns persisted prediction history.

3. **Run backend tests (optional)**
    ```bash
    npm run test
    ```

---

## 6. React Client Setup

1. **Install dependencies**

    ```bash
    cd client
    npm install
    ```

2. **Start the dev server**

    ```bash
    npm run dev
    ```

    Vite serves the UI at `http://127.0.0.1:5173`.

3. **Lint (optional)**
    ```bash
    npm run lint
    ```

The client reads API URLs from `client/src/lib/api.ts`. Update this file if you change the NestJS port.

---

## 7. Running the Full Stack

Start the services in this order:

1. **Flask ML Engine** (`python app.py`)  
   Required if `MODEL_URL` is set; optional when using the bundled ONNX model.
2. **NestJS Backend** (`npm run start:dev`)  
   Proxies prediction requests, persists results to SQLite, and exposes REST endpoints.
3. **React Client** (`npm run dev`)  
   Provides the UI at `http://127.0.0.1:5173`.

Visit the client URL, submit a property estimate, then view prediction history. Console logs from each service provide helpful debugging context.

---

### 7.1 Unified launcher script

A helper script at the repo root can start every service for you:

```bash
chmod +x start-services.sh
./start-services.sh
```

Or use the npm wrapper (no need to mark the script executable first):

```bash
npm run start:services
```

The visit: http://localhost:5173/

The script:

-   Installs missing Node dependencies automatically.
-   Creates `ml-engine/.venv` if needed, installs Python requirements, and launches the Flask ML engine (falls back to system `python3` when necessary).
-   Starts the NestJS backend (`npm run start:dev`).
-   Starts the React client (`npm run dev`).
-   Shuts everything down when you press `Ctrl+C`.

If `python3` isn’t on your `PATH`, the script skips the ML engine and continues with the Node services.

---

## 8. Testing Summary

| Layer     | Command        | Notes                                              |
| --------- | -------------- | -------------------------------------------------- |
| ML Engine | `pytest`       | Located in `ml-engine/tests/`.                     |
| NestJS    | `npm run test` | Runs Jest unit tests.                              |
| React     | `npm run lint` | ESLint handles both linting and type-aware checks. |

---

## 9. Troubleshooting

**`sqlite3` build failures:**

-   Ensure Xcode Command Line Tools (macOS) or Build Tools for Visual Studio (Windows) are installed.
-   Re-run `npm rebuild sqlite3 --build-from-source`.

**`onnxruntime-node` installation issues:**

-   Delete `node_modules` and reinstall with `npm install --build-from-source onnxruntime-node`.
-   Apple silicon users may need Rosetta or to set `npm_config_arch=arm64`.

**Flask cannot find the model file:**

-   Run `python train_model.py` to regenerate artifacts.
-   Confirm `ml-engine/models/house_price_model.pkl` exists and restart the Flask app.

**NestJS falls back to local model unexpectedly:**

-   Check that `MODEL_URL` is defined in `backend/.env` and the Flask service is reachable.
-   Set `MODEL_PATH` if you store the ONNX file outside `backend/src/models`.

**React form validation rejects numbers typed slowly:**

-   Inputs accept only positive integers; ensure you enter whole numbers for both fields.

---

## 10. Useful References

-   `SETUP_COMPLETE.md` – High-level summary of a working environment.
-   `backend/README.md` – NestJS module documentation and design notes.
-   `ml-engine/train_model.py` – Training script with inline comments.
-   `take-home.md` – Original problem statement and sample training data.

---

🎉 You now have everything needed to evaluate the Property Estimator application locally. Reach out to the project maintainer if you encounter issues not covered here. Happy reviewing!
