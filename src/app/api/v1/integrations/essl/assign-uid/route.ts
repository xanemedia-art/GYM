import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { assignUidToMember, removeSwipe } from "@/lib/door-lock";

const assignUidSchema = z.object({
  memberId: z.string().uuid("Valid member ID required"),
  uid: z.string().min(1, "UID or card number is required"),
  cardNumber: z.string().optional(),
  swipeId: z.string().optional(),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = assignUidSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, uid, cardNumber, swipeId, deviceId } = parsed.data;

    const result = await assignUidToMember({
      tenantId: session.tenantId,
      memberId,
      uid,
      cardNumber,
      deviceId,
    });

    if (swipeId) {
      removeSwipe(swipeId);
    }

    return apiSuccess(result);
  } catch (error: any) {
    console.error("Assign UID API Error:", error);
    return apiError(error.message || "Failed to bind UID to member", "SERVER_ERROR", 500);
  }
}
