# LoanEase — Loan Eligibility & Lead Management System

Full-stack loan eligibility checker and lead management tool.  
**Backend:** FastAPI (Python) | **Frontend:** Next.js (React) | **DB:** SQLite (SQLAlchemy ORM)

## Project Structure

```
loan-management/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── core/               # Config, DB setup, JWT auth
│   │   ├── models/             # SQLAlchemy models (User, Lead, BRERule)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── api/                # REST API routes
│   │   ├── services/           # Business logic (BRE engine, credit score)
│   │   └── seed.py             # Seeds default admin + BRE rules
│   └── tests/                  # Unit tests (pytest)
│
├── frontend/
│   ├── app/
│   │   ├── page.js             # Loan application form
│   │   └── admin/              # Admin panel pages
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── leads/
│   │       ├── bre/
│   │       └── users/
│   └── lib/api.js              # API client (fetch + JWT)
│
├── postman/                    # Postman collection
├── Dockerfile                  # Docker support
├── docker-compose.yml
└── README.md
```

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first run it auto-creates the SQLite DB, seeds a default admin (`admin` / `admin123`), and adds 5 default BRE rules.

**Swagger docs:** http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## What's Implemented

### Core Modules
1. **Loan Application Form** — responsive form with field validations (Indian mobile, pincode, email, DOB, consent)
2. **Credit Score Integration** — mock CIBIL API (hash-based deterministic scores, 300-900 range, simulated latency + failures)
3. **Business Rule Engine** — all rules stored in DB, evaluated dynamically. Supports numeric + percentage comparisons
4. **Admin Panel** — JWT login, dashboard with stats (total/eligible/rejected leads, avg score)
5. **Lead Management** — table with search, filters (loan type, status), pagination
6. **BRE Management** — admin CRUD for rules, changes take effect immediately
7. **REST API** — `POST /api/leads` runs full pipeline (validate → credit score → BRE → store)
8. **Duplicate Validation** — same mobile number returns 409 "Lead already exists"

### Bonus
- Export leads to Excel (openpyxl)
- Dashboard charts (CSS-based pie/bar/line)
- Swagger API documentation (auto-generated)
- Unit tests (pytest — 14 tests)
- Docker support
- Admin user management from the panel

## Credit Score API

> **Note:** This uses a mock Credit Score API. Real CIBIL/Experian APIs require NBFC/bank licensing in India.

The mock generates deterministic scores using a hash of (name + mobile), with configurable failure rate (5% by default). To integrate a real API, replace `fetch_credit_score()` in `backend/app/services/credit_score.py`.

## Business Rule Engine

Rules are 100% database-driven — nothing is hardcoded. Default rules:

| Rule | Field | Operator | Value |
|------|-------|----------|-------|
| Minimum Age | age | >= | 21 |
| Maximum Age | age | <= | 60 |
| Min Monthly Income | monthly_income | >= | 30,000 |
| Min Credit Score | credit_score | >= | 700 |
| LTV Ratio | loan_amount | <= | 80% of property_value |

Admin can add/edit/delete rules from the BRE Management page. Changes affect all future applications instantly.

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leads` | Submit loan application |
| POST | `/api/auth/login` | Admin login |

### Protected (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads (search/filter/paginate) |
| GET | `/api/leads/{id}` | Single lead detail |
| GET | `/api/leads/export` | Export to Excel |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/bre/rules` | BRE rules CRUD |

### Example Response — POST /api/leads

```json
{
  "status": "success",
  "lead_id": 101,
  "credit_score": 742,
  "bre_status": "Eligible",
  "rejection_reasons": null,
  "message": null
}
```

## Default Admin Login

| Username | Password |
|----------|----------|
| admin | admin123 |

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

## Docker

```bash
docker-compose up --build
```
Backend: http://localhost:8000  
Frontend: http://localhost:3000

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2
- **Frontend:** Next.js 15 (App Router), vanilla CSS
- **Database:** SQLite (easy to swap to PostgreSQL via config)
- **Auth:** JWT (python-jose + bcrypt)
- **Docs:** Swagger/OpenAPI (auto-generated by FastAPI)
