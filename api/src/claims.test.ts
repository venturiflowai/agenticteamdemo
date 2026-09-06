import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

const NINE_FIELDS = [
  'claimId',
  'claimantName',
  'employer',
  'dateOfInjury',
  'injuryType',
  'bodyPart',
  'status',
  'description',
  'adjusterNotes',
] as const;

describe('GET /claims', () => {
  it('AC1: returns 200 with claims, page, totalPages, totalRecords for page=1', async () => {
    const res = await request(app).get('/claims?page=1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('claims');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('totalRecords');
  });

  it('AC2: every claim on a full page has all nine required fields with truthy values', async () => {
    const res = await request(app).get('/claims?page=1');

    expect(res.body.claims.length).toBeGreaterThan(0);
    for (const claim of res.body.claims) {
      for (const field of NINE_FIELDS) {
        expect(claim).toHaveProperty(field);
        expect(claim[field]).toBeTruthy();
      }
    }
  });

  it('AC3: claims contains at most 10 records for pages 1, 2, and 3', async () => {
    for (const page of [1, 2, 3]) {
      const res = await request(app).get(`/claims?page=${page}`);
      expect(res.body.claims.length).toBeLessThanOrEqual(10);
    }
  });

  it('AC4: totalRecords is 25 and totalPages is 3', async () => {
    const res = await request(app).get('/claims?page=1');

    expect(res.body.totalRecords).toBe(25);
    expect(res.body.totalPages).toBe(3);
  });

  it('AC5: page 2 has 10 records, page 3 has 5, and all 25 claimIds across pages 1-3 are unique', async () => {
    const page1 = await request(app).get('/claims?page=1');
    const page2 = await request(app).get('/claims?page=2');
    const page3 = await request(app).get('/claims?page=3');

    expect(page2.body.claims.length).toBe(10);
    expect(page3.body.claims.length).toBe(5);

    const allIds = [
      ...page1.body.claims.map((c: { claimId: string }) => c.claimId),
      ...page2.body.claims.map((c: { claimId: string }) => c.claimId),
      ...page3.body.claims.map((c: { claimId: string }) => c.claimId),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(25);
  });

  it('AC6: no page query parameter behaves as page=1', async () => {
    const noPage = await request(app).get('/claims');
    const page1 = await request(app).get('/claims?page=1');

    const noPageIds = noPage.body.claims.map((c: { claimId: string }) => c.claimId);
    const page1Ids = page1.body.claims.map((c: { claimId: string }) => c.claimId);
    expect(noPageIds).toEqual(page1Ids);
  });

  it('AC7: page greater than totalPages returns 200 with empty claims and echoed page', async () => {
    const res = await request(app).get('/claims?page=4');

    expect(res.status).toBe(200);
    expect(res.body.claims).toEqual([]);
    expect(res.body.page).toBe(4);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.totalRecords).toBe(25);
  });
});
