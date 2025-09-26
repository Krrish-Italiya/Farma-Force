# Performance API Documentation

## Overview
The Performance API provides endpoints to manage and retrieve performance metrics for pharmaceutical sales teams. It includes monthly performance data such as sales, calls, customer coverage, and frequency metrics.

## Endpoints

### 1. Get Performance Data
**GET** `/api/trends/performance`

Retrieves performance data for charts and analytics.

**Query Parameters:**
- `company` (optional): Company name (default: "FarmaForce")
- `period` (optional): Data period (default: "monthly")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "Jan",
      "value": 20000,
      "calls": 150,
      "coverage": 85,
      "frequency": 3.2,
      "target": 22000,
      "achieved": 91
    }
  ],
  "summary": {
    "latestAmount": 27000,
    "growth": 5.9,
    "growthType": "positive",
    "period": "monthly",
    "company": "FarmaForce",
    "totalCalls": 2184,
    "avgCoverage": "91.2",
    "avgFrequency": "3.8"
  }
}
```

### 2. Add Performance Data
**POST** `/api/trends/performance`

Adds or updates performance data for a specific month.

**Request Body:**
```json
{
  "company": "FarmaForce",
  "period": "monthly",
  "year": 2024,
  "month": "Jan",
  "sales": 20000,
  "calls": 150,
  "coverage": 85,
  "frequency": 3.2,
  "target": 22000,
  "achieved": 91,
  "notes": "Strong start to the year"
}
```

**Required Fields:**
- `company`: Company name
- `period`: Data period (daily/weekly/monthly/quarterly)
- `year`: Year
- `month`: Month name
- `sales`: Sales amount

**Response:**
```json
{
  "success": true,
  "performance": {
    "_id": "...",
    "company": "FarmaForce",
    "period": "monthly",
    "year": 2024,
    "month": "Jan",
    "sales": 20000,
    "calls": 150,
    "coverage": 85,
    "frequency": 3.2,
    "target": 22000,
    "achieved": 91,
    "notes": "Strong start to the year",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Data Model

### Performance Schema
```javascript
{
  company: String,        // Company name (required, indexed)
  period: String,         // Data period: daily/weekly/monthly/quarterly (required)
  year: Number,           // Year (required)
  month: String,          // Month name (required)
  sales: Number,          // Sales amount (required)
  calls: Number,          // Number of calls made
  coverage: Number,       // Customer coverage percentage
  frequency: Number,      // Visits per customer
  target: Number,         // Target sales amount
  achieved: Number,       // Percentage of target achieved
  notes: String,          // Additional notes
  metadata: Mixed,        // Flexible metadata field
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

## Setup Instructions

### 1. Populate Initial Data
Run the data population script to create sample performance data:

```bash
cd backend
node createPerformanceData.js
```

### 2. Environment Variables
Ensure your `.env` file contains:
```
MONGODB_URL=your_mongodb_connection_string
PORT=5000
```

### 3. Start the Server
```bash
cd backend
npm start
```

## Usage Examples

### Frontend Integration
```javascript
// Fetch performance data
const response = await fetch('/api/trends/performance?company=FarmaForce&period=monthly');
const data = await response.json();

if (data.success) {
  console.log('Performance data:', data.data);
  console.log('Summary:', data.summary);
}
```

### Adding New Data
```javascript
const newData = {
  company: 'FarmaForce',
  period: 'monthly',
  year: 2024,
  month: 'Jan',
  sales: 25000,
  calls: 180,
  coverage: 90,
  frequency: 3.5,
  target: 24000,
  achieved: 104
};

const response = await fetch('/api/trends/performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newData)
});
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing required fields)
- `404`: Data not found
- `500`: Server error

Error responses include a message field:
```json
{
  "message": "company, period, year, month, and sales are required"
}
```

## Notes

- The API automatically creates sample data if none exists in the database
- Data is indexed by company, period, year, and month for efficient queries
- The frontend includes fallback mock data if the API call fails
- Growth calculations are performed automatically based on the latest two data points




