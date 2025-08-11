# Commission Program REST API

## Overview

This REST API provides comprehensive access to the Commission Program database for seamless integration with Odoo ERP systems. The API handles representatives, sales data, commission rules, and generates detailed reports.

## Quick Start

### 1. Environment Setup

Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
```

### 2. Installation

```bash
npm install
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 4. Access Documentation

Visit `http://localhost:3001/docs` for interactive API documentation.

## Authentication

All API endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

Get your JWT token by authenticating with Supabase in your frontend application.

## API Endpoints

### Representatives
- `GET /api/representatives` - List all representatives
- `GET /api/representatives/:id` - Get representative by ID
- `POST /api/representatives` - Create new representative
- `PUT /api/representatives/:id` - Update representative
- `DELETE /api/representatives/:id` - Delete representative

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Sales Data
- `GET /api/sales` - List all sales (with pagination and filters)
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Collection Records
- `GET /api/collections` - List all collection records
- `GET /api/collections/:id` - Get collection record by ID
- `POST /api/collections` - Create new collection record
- `PUT /api/collections/:id` - Update collection record
- `DELETE /api/collections/:id` - Delete collection record

### Commission Rules
- `GET /api/commission-rules` - List all commission rules
- `GET /api/commission-rules/:id` - Get commission rule by ID
- `POST /api/commission-rules` - Create new commission rule
- `PUT /api/commission-rules/:id` - Update commission rule
- `DELETE /api/commission-rules/:id` - Delete commission rule

### Reports
- `GET /api/reports` - Full commission report for all representatives
- `GET /api/reports/representative/:id` - Commission report for specific representative

## Response Format

All responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## Commission Calculation

The system uses a 3-tier commission structure:

1. **Tier 1**: 70% of target amount × tier1_rate
2. **Tier 2**: 30% of target amount × tier2_rate (if achievement ≥ 71%)
3. **Tier 3**: Amount exceeding target × tier3_rate (if achievement > 100%)

### Example Calculation

```
Target: 250,000
Sales: 350,000
Achievement: 140%

Tier 1: 175,000 (70% of target) × 0.0025 = 437.50
Tier 2: 75,000 (30% of target) × 0.003 = 225.00
Tier 3: 100,000 (sales - target) × 0.004 = 400.00
Total Commission: 1,062.50
```

## Odoo Integration Examples

### Creating a Sale Record

```python
import requests

url = "http://localhost:3001/api/sales"
headers = {
    "Authorization": "Bearer your_jwt_token",
    "Content-Type": "application/json"
}
data = {
    "representative_id": "uuid-here",
    "company_id": "uuid-here",
    "category": "اسمنتي",
    "sales": 150000,
    "target": 120000,
    "year": 2025,
    "month": 1
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Getting Commission Report

```python
import requests

url = "http://localhost:3001/api/reports/representative/uuid-here"
headers = {
    "Authorization": "Bearer your_jwt_token"
}
params = {
    "year": 2025,
    "month": 1
}

response = requests.get(url, headers=headers, params=params)
report = response.json()

if report["success"]:
    summary = report["data"]["summary"]
    print(f"Total Commission: {summary['total_commission']}")
    print(f"Achievement: {summary['achievement_percentage']}%")
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints

## Security Features

- JWT token validation
- CORS support for cross-origin requests
- Helmet.js for security headers
- Request validation with Joi
- SQL injection prevention
- Rate limiting

## Support

For technical support or questions about the API, please contact the development team.