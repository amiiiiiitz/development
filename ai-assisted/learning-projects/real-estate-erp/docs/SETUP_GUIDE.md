# Local Setup Guide — Real Estate ERP

## Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** (or Docker Desktop for one-command startup)

---

## Option A: Run Everything via Docker Compose

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- OpenAPI Docs: `http://localhost:8000/docs`

---

## Option B: Run Services Manually for Local Development

### 1. Create PostgreSQL Database
```sql
CREATE DATABASE real_estate_erp;
```

### 2. Backend Setup (`backend/`)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your local PostgreSQL DATABASE_URL and a random JWT_SECRET_KEY

alembic upgrade head
```

#### Create Initial Administrator (CLI) or via Web UI
You can create the first administrator from the browser on `/login`, or via CLI:
```bash
python -m app.cli create-admin --name "System Admin" --email "admin@company.com"
```

#### Optional: Seed Clearly Labeled `[SAMPLE]` Development Data
Only runs when `ENVIRONMENT=development`:
```bash
python -m app.cli seed-dev
```
This prints the generated development password and sample role accounts (`admin@`, `manager@`, `sales@`, `accounts@`, `support@`).

#### Start FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup (`frontend/`)
In a second terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:3000`.

---

## Running Automated Tests

### Backend (Pytest)
```bash
cd backend
pytest -v
```
*(By default uses isolated in-memory SQLite; set `TEST_DATABASE_URL=postgresql+psycopg://...` to run against a dedicated test PostgreSQL database.)*

### Frontend (Vitest + React Testing Library)
```bash
npm test
# or inside frontend/: npm test
```
