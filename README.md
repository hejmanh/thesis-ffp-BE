# A Web-Based System for Financial Freedom Point (FFP) Estimation and Analysis

## Overview

This project is a web-based Financial Freedom Point (FFP) system designed to help users estimate and analyze their path toward financial independence.

The system combines:

- life expectancy estimation
- savings and wealth accumulation modeling
- portfolio growth simulation
- passive income modeling
- scenario-based financial analysis

The application supports users in answering key financial planning questions such as:

- Can I reach my Financial Freedom goal?
- When will I reach Financial Freedom?
- How much can I spend after reaching Financial Freedom?
- How much should I save to achieve my target?

---

# Core Concepts

The system models a user’s financial lifecycle in two phases.

## 1. Pre-FFP Phase

During this phase:

- users accumulate wealth through savings
- wealth may grow through investment returns
- savings behavior may vary across life stages

---

## 2. Post-FFP Phase

After reaching Financial Freedom:

- active saving is assumed to stop
- wealth is used to support spending
- passive income sources may contribute additional income

---

# Scenario System

The system supports multiple financial planning scenarios, including:

- Financial Freedom feasibility analysis
- Financial Freedom age estimation
- Sustainable spending estimation
- Required savings estimation

---

# Financial Modeling

## Life Expectancy Model

Life expectancy estimation is based on:

- demographic information
- lifestyle-related adjustments

---

## Savings Model

Savings are modeled dynamically across different life stages.

Each stage may define:

- initial savings
- savings growth behavior

---

## Portfolio Model

Portfolio allocation is used to estimate investment growth based on:

- risky asset allocation
- expected return assumptions
- risk-free return assumptions

---

## Passive Income Model

The system supports passive income sources such as:

- pension income
- rental income
- other recurring income streams

---

# Technology Stack

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL

## Authentication

- JWT-based authentication

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=5000
NODE_ENV=production
# Set to false when the API is served over HTTP only (browsers reject Secure cookies on HTTP)
COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

DB_PORT=5432
DB_DATABASE=ffp
DB_USER=your_db_user
DB_PASSWORD=your_db_password

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

GOOGLE_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_REDIRECT_URI=
```

---

# Getting Started

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm

---

## Running with Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root using the example above.

### 3. Start all services

```bash
npm run start-service
```

This single command will:

- Build the backend Docker image
- Start PostgreSQL, Redis, and the backend in containers
- Run all pending database migrations automatically
- Serve the API at `http://localhost:<PORT>` and Swagger UI at `/api-docs`

### Stopping

```bash
docker compose down
```

### Full reset (wipes database volume)

```bash
docker compose down -v
```

---

# Project Structure

```text
db/
|-- migrations/                   # SQL migrations
src/
|-- app.ts                        # Express app setup
|-- server.ts                     # Server entry
|-- config/                       # Environment and app settings
|-- controllers/                  # Handle HTTP requests
|-- middlewares/                  # Request processing
|   |-- errorHandlers.ts
|-- models/                       # Data layer
|-- routes/                       # URL mapping
|   |-- index.ts
|-- services/                     # Business logic
|-- types/                        # Type declarations
|   |-- cors.d.ts
|-- utils/                        # Shared helpers
|-- validators/                   # Input validation
package.json
tsconfig.json
README.md
```
