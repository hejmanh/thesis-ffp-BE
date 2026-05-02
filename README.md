# A Web-Based System for Financial Freedom Point (FFP) Estimation and Analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:

```
npm install
```

2. Start the development server:

```
npm run dev
```

## Project Structure

```
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
