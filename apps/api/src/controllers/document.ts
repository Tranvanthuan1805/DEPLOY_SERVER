import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getDocumentResources(req: Request, res: Response) {
  try {
    const { subject, level, search, isFree } = req.query;

    const whereClause: any = {
      isActive: true,
      isDeleted: false,
    };

    if (subject && subject !== 'all') {
      whereClause.subject = {
        equals: String(subject),
        mode: 'insensitive',
      };
    }

    if (level && level !== 'all') {
      whereClause.level = {
        equals: String(level),
        mode: 'insensitive',
      };
    }

    if (search) {
      whereClause.title = {
        contains: String(search),
        mode: 'insensitive',
      };
    }

    if (isFree !== undefined) {
      whereClause.isFree = isFree === 'true';
    }

    const docs = await prisma.documentResource.findMany({
      where: whereClause,
      orderBy: { id: 'asc' },
    });

    return res.status(200).json({ success: true, data: docs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
