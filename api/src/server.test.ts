import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('GET /health', () => {
  it('returns 200 with a status and a sha field', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBeTruthy();
    expect(res.body.sha).toBeTruthy();
  });
});
