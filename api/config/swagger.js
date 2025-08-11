const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Commission Program API',
      version: '1.0.0',
      description: `
        REST API for Commission Program - Odoo ERP Integration
        
        This API provides endpoints for managing representatives, sales data, commission rules, and generating reports.
        All endpoints require authentication via JWT Bearer token.
        
        ## Authentication
        Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your_jwt_token>\`
        
        ## Response Format
        All responses follow this format:
        - Success: \`{ "success": true, "data": ... }\`
        - Error: \`{ "success": false, "error": "message" }\`
        
        ## Commission Calculation
        The system uses a 3-tier commission structure:
        - **Tier 1**: 70% of target amount
        - **Tier 2**: 30% of target amount (if achievement ≥ 71%)
        - **Tier 3**: Amount exceeding target (if achievement > 100%)
        
        ## Odoo Integration
        This API is designed for seamless integration with Odoo ERP systems.
        All JSON keys use lowercase with underscores for compatibility.
      `,
      contact: {
        name: 'Commission System Support',
        email: 'support@commissionsystem.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-domain.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from Supabase authentication'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Invalid or expired token'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error in request data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Validation error: name is required'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Representatives',
        description: 'Operations related to sales representatives'
      },
      {
        name: 'Sales',
        description: 'Operations related to sales data'
      },
      {
        name: 'Commission Rules',
        description: 'Operations related to commission calculation rules'
      },
      {
        name: 'Reports',
        description: 'Commission reports and analytics'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Commission API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  
  // JSON endpoint for the OpenAPI spec
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation configured at /docs');
};

module.exports = swaggerSetup;