import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing!');
}
const JWT_SECRET = process.env.JWT_SECRET;

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const limitStore = new Map<string, RateLimitInfo>();

// Clean up store every minute to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of limitStore.entries()) {
    if (now > info.resetTime) {
      limitStore.delete(key);
    }
  }
}, 60000);

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const path = req.path;
  
  // Detect if user is authenticated or not, and extract user ID and role/isPro status
  let userPayload: any = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      userPayload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Treat as guest
    }
  }

  const now = Date.now();
  let limit = 30; // Default public rate limit
  let windowMs = 60000; // 1 minute default
  let storeKey = `${ip}:${path}`;

  // Check specific route requirements
  if (path === '/login' || path === '/auth/login') {
    limit = 5;
    windowMs = 15 * 60 * 1000; // 15 mins
    storeKey = `login:${ip}`;
  } else if (path === '/auth/verify-otp-register' || path === '/auth/google/complete-onboarding') {
    limit = 3;
    windowMs = 60 * 60 * 1000; // 1 hour
    storeKey = `register:${ip}`;
  } else if (path.startsWith('/affiliate/track-click')) {
    limit = 60;
    windowMs = 60 * 1000; // 1 min
    storeKey = `track:${ip}`;
  } else if (path.startsWith('/ai/')) {
    if (userPayload) {
      const user = await prisma.user.findUnique({
        where: { id: userPayload.id }
      });
      const isPro = user?.isPro || false;
      limit = isPro ? 200 : 10;
      windowMs = 24 * 60 * 60 * 1000; // 24 hours
      storeKey = `ai:${userPayload.id}`;
    } else {
      limit = 3;
      windowMs = 24 * 60 * 60 * 1000; // 24 hours
      storeKey = `ai_guest:${ip}`;
    }
  } else if (userPayload) {
    limit = 100;
    windowMs = 60 * 1000; // 1 minute
    storeKey = `auth:${userPayload.id}`;
  }

  let info = limitStore.get(storeKey);
  
  if (!info || now > info.resetTime) {
    info = {
      count: 1,
      resetTime: now + windowMs
    };
    limitStore.set(storeKey, info);
  } else {
    info.count++;
  }

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - info.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));

  if (info.count > limit) {
    const errorMsg = path.startsWith('/ai/') 
      ? 'Bạn đã hết lượt sử dụng AI trong ngày hôm nay. Hãy nâng cấp gói PRO để nhận thêm lượt!'
      : 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.';
    return res.status(429).json({
      success: false,
      error: errorMsg
    });
  }

  next();
}
