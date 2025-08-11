# Odoo ERP Integration Guide

## Overview

This guide provides detailed instructions for integrating the Commission Program API with Odoo ERP systems.

## Prerequisites

1. Odoo 15+ installed and configured
2. Commission Program API server running
3. Valid JWT authentication token from Supabase
4. Network access between Odoo and API server

## Authentication Setup

### 1. Store API Credentials in Odoo

Create system parameters in Odoo to store API credentials:

```python
# In Odoo, go to Settings > Technical > Parameters > System Parameters
# Add these parameters:

commission_api_url = "http://localhost:3001/api"
commission_api_token = "your_jwt_token_here"
```

### 2. Create API Helper Class

```python
# addons/commission_integration/models/commission_api.py

import requests
import logging
from odoo import api, models, fields
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class CommissionAPI:
    def __init__(self, env):
        self.env = env
        self.base_url = env['ir.config_parameter'].sudo().get_param('commission_api_url')
        self.token = env['ir.config_parameter'].sudo().get_param('commission_api_token')
        
        if not self.base_url or not self.token:
            raise UserError("Commission API credentials not configured")
    
    @property
    def headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request to Commission API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            _logger.error(f"Commission API request failed: {e}")
            raise UserError(f"API request failed: {str(e)}")
    
    def get_representatives(self):
        """Get all representatives"""
        return self._make_request('GET', '/representatives')
    
    def create_representative(self, name, email=None, phone=None):
        """Create new representative"""
        data = {'name': name}
        if email:
            data['email'] = email
        if phone:
            data['phone'] = phone
        return self._make_request('POST', '/representatives', data)
    
    def get_sales(self, **filters):
        """Get sales data with optional filters"""
        return self._make_request('GET', '/sales', params=filters)
    
    def create_sale(self, representative_id, company_id, category, sales, target, year, month):
        """Create new sale record"""
        data = {
            'representative_id': representative_id,
            'company_id': company_id,
            'category': category,
            'sales': sales,
            'target': target,
            'year': year,
            'month': month
        }
        return self._make_request('POST', '/sales', data)
    
    def get_commission_report(self, representative_id=None, year=None, month=None):
        """Get commission report"""
        if representative_id:
            endpoint = f'/reports/representative/{representative_id}'
        else:
            endpoint = '/reports'
        
        params = {}
        if year:
            params['year'] = year
        if month:
            params['month'] = month
            
        return self._make_request('GET', endpoint, params=params)
```

## Model Integration

### 1. Representative Model

```python
# addons/commission_integration/models/representative.py

from odoo import api, fields, models
from .commission_api import CommissionAPI

class Representative(models.Model):
    _name = 'commission.representative'
    _description = 'Sales Representative'
    
    name = fields.Char('Name', required=True)
    email = fields.Char('Email')
    phone = fields.Char('Phone')
    external_id = fields.Char('External ID', readonly=True)
    
    @api.model
    def sync_from_api(self):
        """Sync representatives from Commission API"""
        api_client = CommissionAPI(self.env)
        response = api_client.get_representatives()
        
        if response.get('success'):
            for rep_data in response['data']:
                existing = self.search([('external_id', '=', rep_data['id'])])
                
                vals = {
                    'name': rep_data['name'],
                    'email': rep_data.get('email'),
                    'phone': rep_data.get('phone'),
                    'external_id': rep_data['id']
                }
                
                if existing:
                    existing.write(vals)
                else:
                    self.create(vals)
    
    def push_to_api(self):
        """Push representative to Commission API"""
        api_client = CommissionAPI(self.env)
        
        if self.external_id:
            # Update existing
            response = api_client.update_representative(
                self.external_id, self.name, self.email, self.phone
            )
        else:
            # Create new
            response = api_client.create_representative(
                self.name, self.email, self.phone
            )
            if response.get('success'):
                self.external_id = response['data']['id']
```

### 2. Sales Order Integration

```python
# addons/commission_integration/models/sale_order.py

from odoo import api, fields, models
from .commission_api import CommissionAPI

class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    representative_id = fields.Many2one('commission.representative', 'Sales Representative')
    commission_synced = fields.Boolean('Commission Synced', default=False)
    
    def action_confirm(self):
        """Override to sync with Commission API when order is confirmed"""
        result = super().action_confirm()
        self._sync_commission_data()
        return result
    
    def _sync_commission_data(self):
        """Sync sale data to Commission API"""
        if not self.representative_id or not self.representative_id.external_id:
            return
        
        api_client = CommissionAPI(self.env)
        
        # Group order lines by category
        category_totals = {}
        for line in self.order_line:
            category = line.product_id.categ_id.name
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += line.price_subtotal
        
        # Create sale records for each category
        for category, amount in category_totals.items():
            try:
                # Get target from representative's quota (implement as needed)
                target = self._get_representative_target(category)
                
                response = api_client.create_sale(
                    representative_id=self.representative_id.external_id,
                    company_id=self._get_company_external_id(),
                    category=category,
                    sales=amount,
                    target=target,
                    year=self.date_order.year,
                    month=self.date_order.month
                )
                
                if response.get('success'):
                    self.commission_synced = True
                    
            except Exception as e:
                _logger.error(f"Failed to sync commission data: {e}")
    
    def _get_representative_target(self, category):
        """Get representative's target for category (implement based on your logic)"""
        # This should return the target amount for the representative/category
        # You can implement this based on your business logic
        return 100000  # Default target
    
    def _get_company_external_id(self):
        """Get company's external ID for Commission API"""
        # Map Odoo company to Commission API company
        # You may need to create a mapping table
        return "company-uuid-here"
```

### 3. Commission Report Integration

```python
# addons/commission_integration/models/commission_report.py

from odoo import api, fields, models
from .commission_api import CommissionAPI

class CommissionReport(models.TransientModel):
    _name = 'commission.report.wizard'
    _description = 'Commission Report Wizard'
    
    representative_id = fields.Many2one('commission.representative', 'Representative')
    year = fields.Integer('Year', default=lambda self: fields.Date.today().year)
    month = fields.Integer('Month', default=lambda self: fields.Date.today().month)
    report_type = fields.Selection([
        ('individual', 'Individual Representative'),
        ('all', 'All Representatives')
    ], default='individual')
    
    def generate_report(self):
        """Generate commission report"""
        api_client = CommissionAPI(self.env)
        
        if self.report_type == 'individual' and self.representative_id:
            response = api_client.get_commission_report(
                representative_id=self.representative_id.external_id,
                year=self.year,
                month=self.month
            )
        else:
            response = api_client.get_commission_report(
                year=self.year,
                month=self.month
            )
        
        if response.get('success'):
            # Process and display report data
            return self._display_report(response['data'])
        else:
            raise UserError(f"Failed to generate report: {response.get('error')}")
    
    def _display_report(self, report_data):
        """Display report in Odoo interface"""
        # Create a view to display the commission report
        # This can be a tree view, pivot view, or custom report
        pass
```

## Automated Synchronization

### 1. Scheduled Actions

Create scheduled actions in Odoo to automatically sync data:

```python
# addons/commission_integration/models/sync_scheduler.py

from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)

class CommissionSync(models.Model):
    _name = 'commission.sync'
    _description = 'Commission Data Synchronization'
    
    @api.model
    def sync_representatives(self):
        """Scheduled action to sync representatives"""
        try:
            self.env['commission.representative'].sync_from_api()
            _logger.info("Representatives synchronized successfully")
        except Exception as e:
            _logger.error(f"Failed to sync representatives: {e}")
    
    @api.model
    def sync_daily_sales(self):
        """Scheduled action to sync daily sales"""
        try:
            # Sync confirmed sales orders from yesterday
            yesterday = fields.Date.today() - timedelta(days=1)
            orders = self.env['sale.order'].search([
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', yesterday),
                ('date_order', '<', fields.Date.today()),
                ('commission_synced', '=', False)
            ])
            
            for order in orders:
                order._sync_commission_data()
                
            _logger.info(f"Synced {len(orders)} sales orders")
        except Exception as e:
            _logger.error(f"Failed to sync sales: {e}")
```

### 2. Webhook Integration

For real-time synchronization, you can set up webhooks:

```python
# addons/commission_integration/controllers/webhook.py

from odoo import http
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)

class CommissionWebhook(http.Controller):
    
    @http.route('/commission/webhook', type='json', auth='none', methods=['POST'], csrf=False)
    def commission_webhook(self):
        """Handle webhooks from Commission API"""
        try:
            data = request.jsonrequest
            event_type = data.get('event_type')
            
            if event_type == 'sale_created':
                self._handle_sale_created(data['data'])
            elif event_type == 'commission_calculated':
                self._handle_commission_calculated(data['data'])
            
            return {'success': True}
        except Exception as e:
            _logger.error(f"Webhook processing failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _handle_sale_created(self, sale_data):
        """Handle sale creation webhook"""
        # Update related records in Odoo
        pass
    
    def _handle_commission_calculated(self, commission_data):
        """Handle commission calculation webhook"""
        # Update commission records in Odoo
        pass
```

## Testing

### 1. API Testing

```bash
# Test authentication
curl -H "Authorization: Bearer your_token" \
     http://localhost:3001/api/representatives

# Test creating a representative
curl -X POST \
     -H "Authorization: Bearer your_token" \
     -H "Content-Type: application/json" \
     -d '{"name":"أحمد محمد","email":"ahmed@example.com"}' \
     http://localhost:3001/api/representatives

# Test getting commission report
curl -H "Authorization: Bearer your_token" \
     "http://localhost:3001/api/reports?year=2025&month=1"
```

### 2. Odoo Integration Testing

```python
# Test in Odoo shell
api_client = CommissionAPI(env)

# Test getting representatives
reps = api_client.get_representatives()
print(reps)

# Test creating a sale
sale = api_client.create_sale(
    representative_id="uuid-here",
    company_id="uuid-here",
    category="اسمنتي",
    sales=150000,
    target=120000,
    year=2025,
    month=1
)
print(sale)
```

## Best Practices

1. **Error Handling**: Always check the `success` field in API responses
2. **Rate Limiting**: Implement retry logic with exponential backoff
3. **Data Validation**: Validate data before sending to API
4. **Logging**: Log all API interactions for debugging
5. **Caching**: Cache frequently accessed data like commission rules
6. **Batch Operations**: Group multiple operations when possible

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT token validity
   - Ensure token is properly formatted in Authorization header

2. **400 Validation Error**
   - Check required fields are provided
   - Verify data types match API expectations

3. **404 Not Found**
   - Verify resource IDs exist
   - Check endpoint URLs are correct

4. **Rate Limit Exceeded**
   - Implement retry logic with delays
   - Consider caching frequently accessed data

### Debug Mode

Enable debug logging in Odoo:

```python
import logging
logging.getLogger('commission_integration').setLevel(logging.DEBUG)
```

## Performance Optimization

1. **Pagination**: Use pagination for large datasets
2. **Filtering**: Apply filters to reduce data transfer
3. **Caching**: Cache commission rules and representative data
4. **Batch Processing**: Process multiple records in batches
5. **Async Processing**: Use Odoo's queue system for heavy operations

## Security Considerations

1. **Token Management**: Rotate JWT tokens regularly
2. **HTTPS**: Use HTTPS in production
3. **IP Whitelisting**: Restrict API access to known IPs
4. **Audit Logging**: Log all API operations
5. **Data Encryption**: Encrypt sensitive data in transit

## Support

For integration support, contact the development team with:
- Odoo version
- Error logs
- API request/response examples
- Network configuration details