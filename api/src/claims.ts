import { Router, type Request, type Response } from 'express';
import claimsSeedData from './data/claims.seed.json' with { type: 'json' };

export interface Claim {
  claimId: string;
  claimantName: string;
  employer: string;
  dateOfInjury: string;
  injuryType: string;
  bodyPart: string;
  status: string;
  description: string;
  adjusterNotes: string;
}

export interface ClaimsPage {
  claims: Claim[];
  page: number;
  totalPages: number;
  totalRecords: number;
}

const PAGE_SIZE = 10;

export const claimsSeed: Claim[] = claimsSeedData as Claim[];

function parsePage(rawPage: unknown): number {
  if (typeof rawPage !== 'string') {
    return 1;
  }
  const parsed = Number(rawPage);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function getClaimsPage(rawPage: unknown): ClaimsPage {
  const page = parsePage(rawPage);
  const totalRecords = claimsSeed.length;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const claims = claimsSeed.slice(start, start + PAGE_SIZE);

  return { claims, page, totalPages, totalRecords };
}

export const claimsRouter = Router();

claimsRouter.get('/claims', (req: Request, res: Response) => {
  const result = getClaimsPage(req.query.page);
  res.status(200).json(result);
});
