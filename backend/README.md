# NestJS Backend - Property Estimator API

This NestJS backend serves as the API layer between React frontend and Flask prediction service. It handles database operations using TypeORM with SQLite.

## Architecture

```
React Frontend (Port 5173)
    ↓
NestJS Backend (Port 3001) - API + Database
    ↓
Flask Backend (Port 5000) - ML Predictions Only
```

## Features

- **TypeORM with SQLite**: Database operations using TypeORM
- **REST API**: Endpoints for predictions and history
- **CORS Enabled**: Configured for React frontend
- **Validation**: Input validation using class-validator
- **Error Handling**: Proper error handling and HTTP status codes

## Setup

### 1. Install Dependencies

```powershell
cd backend_nest
npm install
```

### 2. Environment Variables

Create a `.env` file (optional):

```env
PORT=3001
FLASK_URL=http://127.0.0.1:5000
```

### 3. Run Development Server

```powershell
npm run start:dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /predict
Creates a new prediction by calling Flask and saving to database.

**Request:**
```json
{
  "square_footage": 1500,
  "bedrooms": 3
}
```

**Response:**
```json
{
  "square_footage": 1500,
  "bedrooms": 3,
  "predicted_price": 250000.00
}
```

### GET /predictions?limit=100
Gets prediction history from database.

**Query Parameters:**
- `limit` (optional): Number of predictions to return (default: 100)

**Response:**
```json
{
  "count": 10,
  "predictions": [
    {
      "id": 1,
      "square_footage": 1500,
      "bedrooms": 3,
      "predicted_price": 250000.00,
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Database

- **Type**: SQLite
- **File**: `predictions.db` (created automatically)
- **ORM**: TypeORM
- **Entity**: `Prediction` (id, square_footage, bedrooms, predicted_price, created_at)

## Project Structure

```
backend_nest/
├── src/
│   ├── prediction/
│   │   ├── prediction.entity.ts      # TypeORM entity
│   │   ├── prediction.service.ts     # Business logic
│   │   ├── prediction.controller.ts  # API endpoints
│   │   ├── prediction.module.ts      # Module definition
│   │   └── dto/
│   │       └── create-prediction.dto.ts  # Data transfer object
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Application entry point
├── predictions.db                    # SQLite database (auto-created)
└── package.json
```

## Development

```powershell
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm test
```

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/core` - NestJS core
- `@nestjs/typeorm` - TypeORM integration
- `typeorm` - ORM library
- `sqlite3` - SQLite database driver
- `class-validator` - Validation decorators
- `class-transformer` - Object transformation

## Notes

- Database is automatically created on first run
- `synchronize: true` is enabled for development (auto-create tables)
- CORS is enabled for all origins (configure for production)
- Flask backend URL can be configured via `FLASK_URL` environment variable
