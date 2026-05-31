# FoodVision Deployment Guide

## Local demo mode

Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
USE_MOCK_MODEL=true uvicorn app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Real model mode

1. Download the trained checkpoint:

```bash
./backend/models/download_model.sh
```

2. Confirm that `backend/models/best_model.pth` exists.
3. Confirm that the matching label order exists at `backend/data/class_mapping.json`.
4. Start the API:

```bash
USE_MOCK_MODEL=false MODEL_ARCHITECTURE=resnet18 uvicorn app.main:app --port 8000
```

## Docker demo mode

From the project root:

```bash
docker compose up --build
```

Open `http://localhost:5173`. The frontend container is exposed on port `5173`; the API
is exposed on port `8000`.

## Health checks

```bash
curl http://localhost:8000/health
curl http://localhost:8000/classes
```
