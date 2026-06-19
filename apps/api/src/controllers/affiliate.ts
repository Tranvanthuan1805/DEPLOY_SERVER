import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

// Helper: Mask email (e.g. ngochoang.le73@gmail.com -> n***@gmail.com)
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 1) return `*@${domain}`;
  return `${name[0]}***@${domain}`;
}

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// GET /affiliate/track-click/:code
export async function trackClick(req: Request, res: Response) {
  const { code } = req.params;
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: code },
      include: { user: true }
    });

    if (!affiliate || !affiliate.isApproved) {
      // Redirect to home if code invalid or not approved
      return res.redirect('http://localhost:5173/');
    }

    // Set ref cookie (valid for 30 days)
    res.cookie('ref_code', code, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      secure: false, // In localhost set to false, future production can be true
      sameSite: 'lax'
    });

    // Increment click counts (we can increment in first available marketing material or write an audit/log)
    // For demo/thesis, we can just increment a dummy general material or log it
    await prisma.affiliateMaterial.updateMany({
      where: { affiliateId: affiliate.userId, type: 'link' },
      data: { clicks: { increment: 1 } }
    });

    return res.redirect(`http://localhost:5173/?ref=${code}`);
  } catch (err: any) {
    return res.redirect('http://localhost:5173/');
  }
}

// GET /affiliate/leaderboard (Top 10 public affiliates by total earnings)
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const topAffiliates = await prisma.affiliate.findMany({
      where: { isApproved: true },
      orderBy: { totalEarnings: 'desc' },
      take: 10,
      include: {
        user: {
          select: { fullName: true, avatarUrl: true }
        }
      }
    });

    const result = topAffiliates.map((aff, index) => ({
      rank: index + 1,
      name: aff.user.fullName,
      avatarUrl: aff.user.avatarUrl,
      tier: aff.tier,
      totalEarnings: aff.totalEarnings
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 2. AFFILIATE ENDPOINTS
// ==========================================

// GET /affiliate/me
export async function getAffiliateMe(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, fullName: true, avatarUrl: true }
        },
        referrals: {
          where: { isConverted: true }
        },
        payouts: {
          orderBy: { requestedAt: 'desc' }
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đối tác!' });
    }

    const referralsCount = await prisma.referral.count({ where: { affiliateId: userId } });
    const convertedCount = affiliate.referrals.length;

    return res.status(200).json({
      success: true,
      data: {
        ...affiliate,
        referralsCount,
        convertedCount,
        user: affiliate.user
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /affiliate/me
export async function updateAffiliateMe(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { bankAccount, bankName, taxId, payoutMethod } = req.body;

  try {
    const updated = await prisma.affiliate.update({
      where: { userId },
      data: {
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        taxId: taxId || null,
        payoutMethod: payoutMethod || null
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /affiliate/me/referrals (Paginated list, masked emails)
export async function getMyReferrals(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.referral.count({ where: { affiliateId: userId } });
    const referrals = await prisma.referral.findMany({
      where: { affiliateId: userId },
      orderBy: { clickedAt: 'desc' },
      skip,
      take: limit,
      include: {
        referredUser: {
          select: { email: true, fullName: true }
        }
      }
    });

    const result = referrals.map(ref => ({
      id: ref.id,
      referredUserName: ref.referredUser.fullName,
      referredUserEmailMasked: maskEmail(ref.referredUser.email),
      source: ref.source,
      campaign: ref.campaign,
      clickedAt: ref.clickedAt,
      convertedAt: ref.convertedAt,
      isConverted: ref.isConverted
    }));

    return res.status(200).json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        referrals: result
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /affiliate/me/commissions
export async function getMyCommissions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const status = req.query.status as string; // PENDING, APPROVED, PAID, CANCELLED

  try {
    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: userId,
        ...(status ? { status: status as any } : {})
      },
      orderBy: { earnedAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: commissions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /affiliate/me/analytics (chart data: earnings by date)
export async function getMyAnalytics(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    // Return last 30 days of commissions earned
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: userId,
        earnedAt: { gte: startDate }
      },
      select: {
        amount: true,
        earnedAt: true
      },
      orderBy: { earnedAt: 'asc' }
    });

    // Group by date
    const dailyEarnings: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dailyEarnings[dateStr] = 0;
    }

    commissions.forEach(c => {
      const dateStr = new Date(c.earnedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (dailyEarnings[dateStr] !== undefined) {
        dailyEarnings[dateStr] += c.amount;
      }
    });

    const chartData = Object.entries(dailyEarnings).map(([date, earnings]) => ({
      date,
      earnings
    })).reverse();

    const materials = await prisma.affiliateMaterial.findMany({
      where: { affiliateId: userId }
    });

    return res.status(200).json({
      success: true,
      data: {
        dailyEarnings: chartData,
        materialsStats: materials.map(m => ({
          id: m.id,
          type: m.type,
          clicks: m.clicks,
          conversions: m.conversions
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /affiliate/me/payout-request
export async function requestPayout(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { amount } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Số tiền rút không hợp lệ!' });
  }

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });

    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đối tác!' });
    }

    // Check minimum payout amount based on tier
    // BRONZE: 200,000 VND, SILVER: 150,000 VND, GOLD/PLATINUM: 50,000 VND
    let minAmount = 200000;
    if (affiliate.tier === 'SILVER') minAmount = 150000;
    else if (affiliate.tier === 'GOLD' || affiliate.tier === 'PLATINUM') minAmount = 50000;

    if (amount < minAmount) {
      return res.status(400).json({ success: false, error: `Số tiền rút tối thiểu cho cấp bậc ${affiliate.tier} là ${minAmount.toLocaleString()}đ` });
    }

    const availableBalance = affiliate.pendingEarnings; // pendingEarnings holds currently claimable balance
    if (amount > availableBalance) {
      return res.status(400).json({ success: false, error: 'Số dư khả dụng không đủ!' });
    }

    // Create Payout request
    const payout = await prisma.payout.create({
      data: {
        affiliateId: userId,
        amount: Number(amount),
        method: affiliate.payoutMethod || 'bank',
        status: 'PENDING'
      }
    });

    // Subtract from pendingEarnings immediately (optimistic reservation)
    await prisma.affiliate.update({
      where: { userId },
      data: {
        pendingEarnings: { decrement: Number(amount) }
      }
    });

    return res.status(201).json({ success: true, data: payout });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /affiliate/me/materials
export async function getMarketingMaterials(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    let materials = await prisma.affiliateMaterial.findMany({
      where: { affiliateId: userId }
    });

    // If no materials initialized yet, seed them automatically for this user
    if (materials.length === 0) {
      const code = (await prisma.affiliate.findUnique({ where: { userId } }))?.referralCode || 'REFCODE';
      const defaults = [
        { type: 'link', targetUrl: `http://localhost:5173/?ref=${code}`, copy: 'Hệ thống học tập sơ đồ tư duy thông minh EduPath AI. Đăng ký ngay!' },
        { type: 'banner', targetUrl: `http://localhost:5173/?ref=${code}`, imageUrl: 'https://edupath.vn/assets/images/banner_marketing.jpg', copy: 'Học đúng hướng, thi đúng đích cùng EduPath AI!' }
      ];

      for (const d of defaults) {
        await prisma.affiliateMaterial.create({
          data: {
            affiliateId: userId,
            type: d.type,
            targetUrl: d.targetUrl,
            imageUrl: d.imageUrl || null,
            copy: d.copy
          }
        });
      }

      materials = await prisma.affiliateMaterial.findMany({
        where: { affiliateId: userId }
      });
    }

    return res.status(200).json({ success: true, data: materials });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /affiliate/me/materials/track
export async function trackMaterialClick(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { materialId, isConversion } = req.body;
  try {
    const updated = await prisma.affiliateMaterial.update({
      where: { id: Number(materialId), affiliateId: userId },
      data: {
        clicks: { increment: 1 },
        ...(isConversion ? { conversions: { increment: 1 } } : {})
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 3. ADMIN ENDPOINTS
// ==========================================

// GET /admin/affiliates
export async function getAdminAffiliates(req: AuthRequest, res: Response) {
  const status = req.query.status as string; // 'pending' or 'approved' or 'all'

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: {
        ...(status === 'pending' ? { isApproved: false } : (status === 'approved' ? { isApproved: true } : {}))
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true, createdAt: true }
        },
        referrals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = affiliates.map(aff => ({
      userId: aff.userId,
      referralCode: aff.referralCode,
      commissionRate: aff.commissionRate,
      totalEarnings: aff.totalEarnings,
      pendingEarnings: aff.pendingEarnings,
      paidEarnings: aff.paidEarnings,
      tier: aff.tier,
      bankName: aff.bankName,
      bankAccount: aff.bankAccount,
      payoutMethod: aff.payoutMethod,
      taxId: aff.taxId,
      isApproved: aff.isApproved,
      approvedAt: aff.approvedAt,
      createdAt: aff.createdAt,
      fullName: aff.user.fullName,
      email: aff.user.email,
      registeredDate: aff.user.createdAt,
      referralsCount: aff.referrals.length
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/affiliates/:id/approve
export async function approveAffiliate(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: id }
    });

    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đối tác!' });
    }

    const updated = await prisma.affiliate.update({
      where: { userId: id },
      data: {
        isApproved: true,
        approvedAt: new Date()
      }
    });

    return res.status(200).json({ success: true, data: { message: 'Đã phê duyệt đối tác thành công!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/affiliates/:id/reject
export async function rejectAffiliate(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: id }
    });

    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đối tác!' });
    }

    // Delete the affiliate record and update the user's role back to STUDENT
    await prisma.$transaction([
      prisma.affiliate.delete({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: { role: 'STUDENT' }
      })
    ]);

    return res.status(200).json({ success: true, data: { message: 'Đã từ chối đối tác và chuyển tài khoản về học sinh.' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /admin/affiliates/:id/tier
export async function updateAffiliateTier(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const { tier } = req.body; // BRONZE, SILVER, GOLD, PLATINUM
  if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier)) {
    return res.status(400).json({ success: false, error: 'Cấp bậc đối tác không hợp lệ.' });
  }

  try {
    const updated = await prisma.affiliate.update({
      where: { userId: id },
      data: { tier }
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /admin/affiliates/:id/commission-rate
export async function updateAffiliateCommissionRate(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const { commissionRate } = req.body;
  if (commissionRate === undefined || isNaN(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 1) {
    return res.status(400).json({ success: false, error: 'Tỉ lệ hoa hồng không hợp lệ (0 đến 1)!' });
  }

  try {
    const updated = await prisma.affiliate.update({
      where: { userId: id },
      data: { commissionRate: Number(commissionRate) }
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /admin/affiliates/payouts/pending
export async function getAdminPendingPayouts(req: AuthRequest, res: Response) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    const result = payouts.map(p => ({
      id: p.id,
      affiliateId: p.affiliateId,
      fullName: p.affiliate.user.fullName,
      email: p.affiliate.user.email,
      amount: p.amount,
      method: p.method,
      status: p.status,
      requestedAt: p.requestedAt,
      bankAccount: p.affiliate.bankAccount,
      bankName: p.affiliate.bankName
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/affiliates/payouts/:id/approve
export async function approvePayout(req: AuthRequest, res: Response) {
  const payoutId = parseInt(req.params.id);
  const { transactionId } = req.body;

  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền!' });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Yêu cầu này đã được xử lý!' });
    }

    // Approve Payout
    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          transactionId: transactionId || `TXN_AUTO_${Date.now()}`
        }
      }),
      // Move from totalEarnings to paidEarnings
      prisma.affiliate.update({
        where: { userId: payout.affiliateId },
        data: {
          paidEarnings: { increment: payout.amount }
        }
      })
    ]);

    return res.status(200).json({ success: true, data: { message: 'Đã phê duyệt và hoàn tất thanh toán hoa hồng!' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/affiliates/payouts/:id/reject
export async function rejectPayout(req: AuthRequest, res: Response) {
  const payoutId = parseInt(req.params.id);
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền!' });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Yêu cầu này đã được xử lý!' });
    }

    // Reject payout request
    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      }),
      // Return reserved balance back to pendingEarnings
      prisma.affiliate.update({
        where: { userId: payout.affiliateId },
        data: {
          pendingEarnings: { increment: payout.amount }
        }
      })
    ]);

    return res.status(200).json({ success: true, data: { message: 'Đã từ chối yêu cầu thanh toán. Số dư đã được hoàn lại.' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/affiliates/commissions/auto-approve (cron equivalent)
export async function autoApproveCommissions(req: Request, res: Response) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find all PENDING commissions older than 7 days
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        status: 'PENDING',
        earnedAt: { lte: sevenDaysAgo }
      }
    });

    if (pendingCommissions.length === 0) {
      return res.status(200).json({ success: true, data: { message: 'Không có hoa hồng nào đủ điều kiện phê duyệt tự động.' } });
    }

    // Update commissions and add to affiliate earnings in transaction
    const updatePromises = pendingCommissions.map(async (comm) => {
      return prisma.$transaction([
        prisma.commission.update({
          where: { id: comm.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date()
          }
        }),
        prisma.affiliate.update({
          where: { userId: comm.affiliateId },
          data: {
            pendingEarnings: { increment: comm.amount },
            totalEarnings: { increment: comm.amount }
          }
        })
      ]);
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      data: {
        message: `Đã tự động duyệt thành công ${pendingCommissions.length} hoa hồng đã qua thời gian hoàn tiền 7 ngày.`
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
