import { NextRequest } from "next/server";
import { getVapidPublicKey } from "@/lib/push-notifications";
import { apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const publicKey = getVapidPublicKey();
    return apiSuccess({ publicKey });
  } catch (error: any) {
    console.error("Get VAPID Key Error:", error);
    return apiSuccess({ publicKey: getVapidPublicKey() });
  }
}
