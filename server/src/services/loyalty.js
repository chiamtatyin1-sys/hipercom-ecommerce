import prisma from '../db/prisma.js';

const POINTS_PER_RM = 1;
const POINTS_REDEEM_RATE = 100;

export async function earnPoints(userId, orderId, amount) {
  try {
    const points = Math.floor(amount * POINTS_PER_RM);

    if (points <= 0) return { points: 0 };

    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        orderId,
        points,
        type: 'earn',
        description: `Earned from order #${orderId}`,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { wallet: { increment: points } },
    });

    return { points };
  } catch (error) {
    console.error('Earn points error:', error);
    throw error;
  }
}

export async function redeemPoints(userId, points) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: true },
    });

    if (!user || user.wallet < points) {
      throw new Error('Insufficient points');
    }

    const discount = points / POINTS_REDEEM_RATE;

    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: -points,
        type: 'redeem',
        description: `Redeemed ${points} points for RM ${discount.toFixed(2)} discount`,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { wallet: { decrement: points } },
    });

    return {
      pointsRedeemed: points,
      discount,
    };
  } catch (error) {
    console.error('Redeem points error:', error);
    throw error;
  }
}

export async function getLoyaltyHistory(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
      },
    }),
    prisma.loyaltyTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getLoyaltyBalance(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: true },
    });

    const totalEarned = await prisma.loyaltyTransaction.aggregate({
      where: { userId, type: 'earn' },
      _sum: { points: true },
    });

    const totalRedeemed = await prisma.loyaltyTransaction.aggregate({
      where: { userId, type: 'redeem' },
      _sum: { points: true },
    });

    return {
      balance: user?.wallet || 0,
      totalEarned: totalEarned._sum.points || 0,
      totalRedeemed: Math.abs(totalRedeemed._sum.points || 0),
      pointsPerRM: POINTS_PER_RM,
      redeemRate: POINTS_REDEEM_RATE,
    };
  } catch (error) {
    console.error('Get loyalty balance error:', error);
    return {
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      pointsPerRM: POINTS_PER_RM,
      redeemRate: POINTS_REDEEM_RATE,
    };
  }
}

export { POINTS_PER_RM, POINTS_REDEEM_RATE };
