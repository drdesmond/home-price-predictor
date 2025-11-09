#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
CLIENT_DIR="$ROOT/client"
ML_DIR="$ROOT/ml-engine"
VENV_DIR=""
PYTHON_CMD="python3"

PIDS=()

cleanup() {
  if [ "${#PIDS[@]}" -gt 0 ]; then
    echo
    echo "Stopping services..."
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        local pgid
        pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
        if [ -n "${pgid}" ]; then
          kill -TERM "-${pgid}" >/dev/null 2>&1 || true
        else
          kill -TERM "$pid" >/dev/null 2>&1 || true
        fi
        sleep 1
        if kill -0 "$pid" >/dev/null 2>&1; then
          if [ -n "${pgid}" ]; then
            kill -KILL "-${pgid}" >/dev/null 2>&1 || true
          else
            kill -KILL "$pid" >/dev/null 2>&1 || true
          fi
        fi
      fi
      wait "$pid" >/dev/null 2>&1 || true
    done
  fi
}

trap cleanup EXIT INT TERM

start_process() {
  local display_name="$1"
  shift

  echo "▶️  Starting ${display_name}..."
  if "$@" &
  then
    local pid=$!
    PIDS+=("$pid")
    echo "   ${display_name} running (pid ${pid})"
  else
    echo "   Failed to start ${display_name}"
  fi
}

ensure_dependency() {
  local directory="$1"
  local name="$2"

  if [ ! -d "${directory}/node_modules" ]; then
    echo "📦 Installing dependencies for ${name}..."
    npm install --prefix "${directory}"
  fi
}

echo "Property Estimator – multi-service launcher"
echo "Root directory: ${ROOT}"
echo

if [ -f "${ML_DIR}/app.py" ]; then
  create_virtualenv() {
    if ! command -v python3 >/dev/null 2>&1; then
      echo "⚠️  python3 not available; cannot create virtual environment."
      return 1
    fi

    echo "🐍 Creating Python virtual environment in ${ML_DIR}/.venv ..."
    if python3 -m venv "${ML_DIR}/.venv"; then
      VENV_DIR="${ML_DIR}/.venv"
      if [ -x "${VENV_DIR}/bin/pip" ]; then
        echo "📦 Installing ML engine requirements..."
        if ! "${VENV_DIR}/bin/pip" install --upgrade pip >/dev/null 2>&1; then
          echo "   (pip upgrade failed; continuing with existing version)"
        fi
        if [ -f "${ML_DIR}/requirements.txt" ]; then
          if ! "${VENV_DIR}/bin/pip" install -r "${ML_DIR}/requirements.txt"; then
            echo "⚠️  Failed to install ML engine requirements; Flask service may not start."
          fi
        fi
      fi
      return 0
    else
      echo "⚠️  Failed to create virtual environment."
      return 1
    fi
  }

  if [ -d "${ML_DIR}/.venv" ] && [ -x "${ML_DIR}/.venv/bin/python" ]; then
    VENV_DIR="${ML_DIR}/.venv"
  elif [ -d "${ML_DIR}/env" ] && [ -x "${ML_DIR}/env/bin/python" ]; then
    VENV_DIR="${ML_DIR}/env"
  elif [ -f "${ML_DIR}/requirements.txt" ]; then
    create_virtualenv || true
  fi

  if [ -n "${VENV_DIR}" ]; then
    PYTHON_CMD="${VENV_DIR}/bin/python"
    echo "🐍 Using virtual environment at ${VENV_DIR}"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="$(command -v python3)"
    echo "❕ No virtual environment detected. Using system python: ${PYTHON_CMD}"
  else
    echo "⚠️  python3 not found on PATH and no virtualenv located. Skipping Flask ML engine."
    PYTHON_CMD=""
  fi

  if [ -n "${PYTHON_CMD}" ]; then
    start_process "Flask ML engine" "${PYTHON_CMD}" "${ML_DIR}/app.py"
  fi
else
  echo "⚠️  Skipping Flask ML engine (app.py not found)."
fi

ensure_dependency "${BACKEND_DIR}" "NestJS backend"
start_process "NestJS backend" npm --prefix "${BACKEND_DIR}" run start:dev

ensure_dependency "${CLIENT_DIR}" "React client"
start_process "React client" npm --prefix "${CLIENT_DIR}" run dev
echo "   ➜ React dev server: http://127.0.0.1:5173 (or http://localhost:5173)"

echo
echo "All requested services started. Press Ctrl+C to stop."
echo "Frontend available at: http://localhost:5173/"
echo

wait -n || true
echo
echo "A service exited. Waiting for remaining processes..."
wait || true

