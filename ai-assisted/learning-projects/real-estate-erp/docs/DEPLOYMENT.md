# Deployment & Operations Guide — Real Estate ERP

## 1. Production Environment Variables

### Backend (`backend/.env` or Container Env)
| Variable | Requirement | Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Enables strict startup checks (requires explicit `JWT_SECRET_KEY`). |
| `DATABASE_URL` | Required | `postgresql+psycopg://USER:PASSWORD@HOST:5432/DB_NAME` |
| `JWT_SECRET_KEY` | Required (min 32 bytes) | Generate with `python3 -c "import secrets; print(secrets.token_hex(64))"` |
| `CORS_ORIGINS` | Required | Exact frontend origin(s), e.g. `https://erp.yourdomain.com` |
| `REFRESH_COOKIE_SECURE` | `true` in HTTPS | Ensures refresh token cookies travel only over TLS. |
| `REFRESH_COOKIE_SAMESITE` | `lax` or `none` | Use `lax` when frontend & API share a site; `none` for cross-origin HTTPS. |

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`

---

## 2. Production Build & Hosting

### Frontend Hosting (Static / CDN / Nginx)
```bash
cd frontend
npm ci
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build
```
Deploy `frontend/dist/` to Nginx (see `frontend/Dockerfile` & `frontend/nginx.conf`), Cloudflare Pages, Vercel, or Cloud Run.

### Backend Hosting (Container / Gunicorn+Uvicorn)
Run database migrations before starting app workers:
```bash
cd backend
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
Configure reverse proxy TLS termination (Nginx / Caddy / Cloud Load Balancer) and forward `X-Forwarded-For`.

---

## 3. Database Backup & Restore Procedures

### Backup (pg_dump)
```bash
pg_dump -Fc --no-owner --no-acl -h <HOST> -U <USER> -d real_estate_erp \
  -f "real_estate_erp_$(date +%Y%m%d_%H%M%S).dump"
```

### Restore (pg_restore)
```bash
createdb -h <HOST> -U <USER> real_estate_erp_restored
pg_restore --no-owner --no-acl -h <HOST> -U <USER> -d real_estate_erp_restored \
  real_estate_erp_20261125_120000.dump
```
After restoring, verify schema version:
```bash
cd backend && alembic current
```
