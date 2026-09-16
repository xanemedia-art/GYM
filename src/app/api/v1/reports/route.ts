import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { formatINR } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "VIEW_FINANCIAL_REPORTS")) {
      return apiError("Insufficient permission to access analytics reports", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y

    const tenantId = session.tenantId;

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (range === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // 30d default
      startDate.setDate(now.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // 1. Payment collections & Tender distribution
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        paymentDate: { gte: startDate, lte: now },
      },
      include: {
        invoice: { select: { invoiceNumber: true } },
        member: { select: { firstName: true, lastName: true, memberCode: true } },
        collectedBy: { select: { fullName: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const modeBreakdown: Record<string, number> = {
      UPI: 0,
      CASH: 0,
      CARD: 0,
      NETBANKING: 0,
      ONLINE_PAYMENT_GATEWAY: 0,
    };
    payments.forEach((p) => {
      modeBreakdown[p.mode] = (modeBreakdown[p.mode] || 0) + Number(p.amount);
    });

    // 2. GST Invoices Summary
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issuedAt: { gte: startDate, lte: now },
      },
    });

    const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const totalTaxable = invoices.reduce((acc, inv) => acc + Number(inv.taxableAmount), 0);
    const totalCgst = invoices.reduce((acc, inv) => acc + Number(inv.cgstAmount), 0);
    const totalSgst = invoices.reduce((acc, inv) => acc + Number(inv.sgstAmount), 0);
    const totalIgst = invoices.reduce((acc, inv) => acc + Number(inv.igstAmount), 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.balanceAmount), 0);

    // 3. Member Status Overview
    const [activeCount, expiringSoonCount, expiredCount, totalMembers] = await Promise.all([
      prisma.member.count({ where: { tenantId, status: "ACTIVE", isDeleted: false } }),
      prisma.member.count({ where: { tenantId, status: "EXPIRING_SOON", isDeleted: false } }),
      prisma.member.count({ where: { tenantId, status: "EXPIRED", isDeleted: false } }),
      prisma.member.count({ where: { tenantId, isDeleted: false } }),
    ]);

    // 4. Attendance Trends & Hourly Peak Distribution
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        punchTime: { gte: startDate, lte: now },
      },
      select: { punchTime: true, punchType: true },
    });

    const hourlyDistribution: Record<number, number> = {};
    for (let h = 5; h <= 23; h++) {
      hourlyDistribution[h] = 0;
    }

    attendanceRecords.forEach((att) => {
      const hour = new Date(att.punchTime).getHours();
      if (hourlyDistribution[hour] !== undefined) {
        hourlyDistribution[hour]++;
      }
    });

    return apiSuccess({
      period: { range, startDate, endDate: now },
      financials: {
        totalCollected,
        totalBilled,
        totalTaxable,
        totalCgst,
        totalSgst,
        totalIgst,
        totalOutstanding,
        modeBreakdown,
        recentTransactions: payments.slice(0, 15),
      },
      members: {
        total: totalMembers,
        active: activeCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
      },
      attendance: {
        totalPunches: attendanceRecords.length,
        hourlyDistribution,
      },
    });
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return apiError("Failed to aggregate reports", "SERVER_ERROR", 500);
  }
}
