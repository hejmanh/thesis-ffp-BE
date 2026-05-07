# A Web-Based System for Financial Freedom Point (FFP) Estimation and Analysis

## Overview

This project is a web-based Financial Freedom Planning (FFP) system designed to help users estimate and analyze their path toward financial independence.

The system combines:

* life expectancy estimation
* savings and wealth accumulation modeling
* portfolio growth simulation
* passive income modeling
* scenario-based financial analysis

The application supports users in answering key financial planning questions such as:

* Can I reach my Financial Freedom goal?
* When will I reach Financial Freedom?
* How much can I spend after reaching Financial Freedom?
* How much should I save to achieve my target?
---

# Core Concepts

The system models a user’s financial lifecycle in two phases.

## 1. Pre-FFP Phase

During this phase:

* users accumulate wealth through savings
* wealth may grow through investment returns
* savings behavior may vary across life stages

---

## 2. Post-FFP Phase

After reaching Financial Freedom:

* active saving is assumed to stop
* wealth is used to support spending
* passive income sources may contribute additional income

---

# Scenario System

The system supports multiple financial planning scenarios, including:

* Financial Freedom feasibility analysis
* Financial Freedom age estimation
* Sustainable spending estimation
* Required savings estimation

---

# Financial Modeling

## Life Expectancy Model

Life expectancy estimation is based on:

* demographic information
* lifestyle-related adjustments

---

## Savings Model

Savings are modeled dynamically across different life stages.

Each stage may define:

* initial savings
* savings growth behavior

---

## Portfolio Model

Portfolio allocation is used to estimate investment growth based on:

* risky asset allocation
* expected return assumptions
* risk-free return assumptions

---

## Passive Income Model

The system supports passive income sources such as:

* pension income
* rental income
* other recurring income streams

---

# Technology Stack

## Backend

* Node.js
* Express.js
* TypeScript

## Database

* PostgreSQL

## Authentication

* JWT-based authentication

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ffp
DB_USER=
DB_PASSWORD=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES=7d
BCRYPT_SALT_ROUNDS=

EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASS=
```

---

# Getting Started

## Prerequisites

* Node.js 18+
* npm
* PostgreSQL

---

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file using the example configuration above.

### 3. Create the database

Create a PostgreSQL database for the project.

### 4. Run database migrations

Execute migration files located in:

```text
db/migrations/
```

### 5. Start the development server

```bash
npm run dev
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