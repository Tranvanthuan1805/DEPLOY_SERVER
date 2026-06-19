import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';

export function auditLogger(req: AuthRequest, res: Response, next: NextFunction) {
  res.on('finish', () => {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    if (!isSuccess || !req.user) return;

    const path = req.originalUrl || req.url;
    const method = req.method;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin');
    const isAffiliatePayout = path.includes('/affiliate/me/payout-request') || path.includes('/affiliate/payout');

    if (isAdminRoute || isAffiliatePayout || isMutation) {
      const userId = req.user.id;
      const userRole = req.user.role;
      const action = `${method} ${req.path}`;
      const target = req.params.id ? `${req.path.split('/').filter(Boolean)[0] || 'entity'}:${req.params.id}` : 'system';
      
      const payload = { ...req.body };
      if (payload.password) payload.password = '***';
      if (payload.oldPassword) payload.oldPassword = '***';
      if (payload.newPassword) payload.newPassword = '***';

      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;

      prisma.auditLog.create({
        data: {
          userId,
          userRole,
          action,
          target,
          payload: payload ? (payload as any) : null,
          ipAddress,
          userAgent
        }
      }).catch(err => {
        console.error('[AuditLog Error]', err.message);
      });
    }
  });

  next();
}
