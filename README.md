# Commission Program REST API

A production-ready Express + TypeScript REST API for the Commission Program, designed for seamless Odoo ERP integration.

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
PORT=3001
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access the API

- **API Base URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Documentation**: `http://localhost:3001/docs`

## 📚 API Documentation

Visit `/docs` for interactive Swagger documentation with:
- Complete endpoint reference
- Request/response examples
- Authentication setup
- Try-it-out functionality

## 🔐 Authentication

All API endpoints (except `/health`) require JWT authentication:

```http
Authorization: Bearer <your_supabase_jwt_token>
```

Get your JWT token by authenticating with Supabase in your frontend application.

## 📋 API Endpoints

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

## 🔧 Response Format

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
  "error": "error_message",
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## 💰 Commission Calculation

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

## 🔗 Odoo Integration

### Python Example

```python
import requests

# Configuration
API_BASE = "http://localhost:3001"
JWT_TOKEN = "your_supabase_jwt_token"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# Get all representatives
response = requests.get(f"{API_BASE}/api/representatives", headers=headers)
representatives = response.json()

# Create a sale record
sale_data = {
    "representative_id": "uuid-here",
    "company_id": "uuid-here",
    "category": "اسمنتي",
    "sales": 150000,
    "target": 120000,
    "year": 2025,
    "month": 1
}

response = requests.post(f"{API_BASE}/api/sales", json=sale_data, headers=headers)
result = response.json()

# Get commission report
response = requests.get(
    f"{API_BASE}/api/reports/representative/uuid-here?year=2025&month=1", 
    headers=headers
)
report = response.json()
```

## 🛠️ Development

### Build for Production

```bash
npm run build
npm start
```

### Project Structure

```
src/
├── config/          # Supabase configuration
├── docs/            # Swagger documentation
├── middleware/      # Authentication and error handling
├── routes/          # API route definitions
├── services/        # Business logic (commission calculations)
├── utils/           # Utility functions
└── index.ts         # Main application entry point
```

## 🔒 Security Features

- JWT token validation via Supabase
- CORS support for cross-origin requests
- Request validation with Joi schemas
- Error handling with consistent responses
- TypeScript for type safety

## 📊 Features

- **Pagination**: All list endpoints support pagination
- **Filtering**: Filter by year, month, representative, company
- **Commission Calculation**: Automatic 3-tier commission calculation
- **Odoo Compatible**: All JSON keys use lowercase_underscore format
- **Real-time Data**: Direct connection to Supabase database
- **Type Safety**: Full TypeScript implementation

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT token validity
   - Ensure token is properly formatted in Authorization header

2. **404 Not Found**
   - Verify resource IDs exist in database
   - Check endpoint URLs are correct

3. **Database Connection Issues**
   - Verify SUPABASE_URL and SUPABASE_KEY are correct
   - Check network connectivity to Supabase

### Debug Mode

Set `NODE_ENV=development` for detailed error logging.

## 📞 Support

For technical support or integration questions, please contact the development team.