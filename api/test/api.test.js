const request = require('supertest');
const app = require('../server');

// Mock Supabase for testing
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      setSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

describe('Commission API', () => {
  const mockToken = 'mock-jwt-token';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          version: '1.0.0'
        })
      });
    });
  });

  describe('Authentication', () => {
    test('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/representatives')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authorization header with Bearer token is required'
      });
    });

    test('should return 401 with invalid token format', async () => {
      const response = await request(app)
        .get('/api/representatives')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authorization header with Bearer token is required'
      });
    });
  });

  describe('Representatives API', () => {
    beforeEach(() => {
      // Mock successful authentication
      const { supabase } = require('../config/supabase');
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id', email: 'test@example.com' } },
        error: null
      });
    });

    test('GET /api/representatives should return representatives list', async () => {
      const mockData = [
        { id: '1', name: 'أحمد محمد', created_at: '2025-01-01T00:00:00Z' }
      ];

      const { supabase } = require('../config/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      });

      const response = await request(app)
        .get('/api/representatives')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Endpoint not found'
      });
    });
  });
});