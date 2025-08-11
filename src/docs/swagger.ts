export const spec = {
  openapi: "3.0.3",
  info: {
    title: "Commission Program API",
    version: "1.0.0",
    description: `
      REST API for Commission Program - Odoo ERP Integration
      
      This API provides endpoints for managing representatives, sales data, commission rules, and generating reports.
      All endpoints require authentication via JWT Bearer token from Supabase.
      
      ## Authentication
      Include the JWT token in the Authorization header:
      \`Authorization: Bearer <your_jwt_token>\`
      
      ## Response Format
      All responses follow this format:
      - Success: \`{ "success": true, "data": ... }\`
      - Error: \`{ "success": false, "error": "message" }\`
      
      ## Commission Calculation
      The system uses a 3-tier commission structure:
      - **Tier 1**: 70% of target amount × tier1_rate
      - **Tier 2**: 30% of target amount × tier2_rate (if achievement ≥ 71%)
      - **Tier 3**: Amount exceeding target × tier3_rate (if achievement > 100%)
    `
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from Supabase authentication"
      }
    },
    schemas: {
      Representative: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Sale: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          representative_id: { type: "string", format: "uuid" },
          company_id: { type: "string", format: "uuid" },
          category: { type: "string" },
          sales: { type: "number" },
          target: { type: "number" },
          year: { type: "integer" },
          month: { type: "integer" },
          achievement_percentage: { type: "number" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Collection: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          representative_id: { type: "string", format: "uuid" },
          company_id: { type: "string", format: "uuid" },
          year: { type: "integer" },
          month: { type: "integer" },
          amount: { type: "number" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      CommissionRule: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          category: { type: "string" },
          tier1_from: { type: "number" },
          tier1_to: { type: "number" },
          tier1_rate: { type: "number" },
          tier2_from: { type: "number" },
          tier2_to: { type: "number" },
          tier2_rate: { type: "number" },
          tier3_from: { type: "number" },
          tier3_rate: { type: "number" },
          created_at: { type: "string", format: "date-time" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health Check",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "API is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/representatives": {
      get: {
        summary: "List all representatives",
        tags: ["Representatives"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "page_size", in: "query", schema: { type: "integer", default: 25 } }
        ],
        responses: {
          "200": { description: "Success" }
        }
      },
      post: {
        summary: "Create representative",
        tags: ["Representatives"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Created" }
        }
      }
    },
    "/api/representatives/{id}": {
      get: {
        summary: "Get representative by ID",
        tags: ["Representatives"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Success" },
          "404": { description: "Not found" }
        }
      },
      put: {
        summary: "Update representative",
        tags: ["Representatives"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 2 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Updated" }
        }
      },
      delete: {
        summary: "Delete representative",
        tags: ["Representatives"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Deleted" }
        }
      }
    },
    "/api/companies": {
      get: {
        summary: "List all companies",
        tags: ["Companies"],
        responses: { "200": { description: "Success" } }
      },
      post: {
        summary: "Create company",
        tags: ["Companies"],
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/sales": {
      get: {
        summary: "List all sales data",
        tags: ["Sales"],
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "representative_id", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        responses: { "200": { description: "Success" } }
      },
      post: {
        summary: "Create sale record",
        tags: ["Sales"],
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/commission-rules": {
      get: {
        summary: "List commission rules",
        tags: ["Commission Rules"],
        responses: { "200": { description: "Success" } }
      },
      post: {
        summary: "Create commission rule",
        tags: ["Commission Rules"],
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/reports": {
      get: {
        summary: "Full commission report",
        tags: ["Reports"],
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer" } }
        ],
        responses: { "200": { description: "Success" } }
      }
    },
    "/api/reports/representative/{id}": {
      get: {
        summary: "Representative commission report",
        tags: ["Reports"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer" } }
        ],
        responses: { "200": { description: "Success" } }
      }
    }
  }
} as const;