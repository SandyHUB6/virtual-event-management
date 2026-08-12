const request = require('supertest');
const app = require('../src/app');

describe('Health and Route Verification Test Suite', () => {
  // 66. Health Endpoint Test
  it('66. should return 200 OK and success message for health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      success: true,
      message: "Virtual Event Management API is running"
    });
  });

  // 65. Unknown Route Test
  it('65. should return 404 and Route not found structure for unmatched endpoints', async () => {
    const res = await request(app).get('/this-route-does-not-exist');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({
      success: false,
      message: "Route not found"
    });
  });
});
