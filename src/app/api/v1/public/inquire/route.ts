import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getBranchBySlug, BRANCHES } from "@/data/branches";

const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number"),
  branchSlug: z.string().optional(),
  goal: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { name, phone, branchSlug, goal, message } = parsed.data;
    const branch = branchSlug ? getBranchBySlug(branchSlug) : BRANCHES[0];
    const targetBranch = branch || BRANCHES[0];

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const goalText = goal ? ` for ${goal}` : "";
    const extraMsg = message ? ` Note: "${message.trim()}".` : "";

    const whatsappMessage = `Hi Be Free Fitness (${targetBranch.name})! My name is ${name.trim()} (${cleanPhone}). I am interested in joining your gym${goalText}.${extraMsg} Please share membership plans, current offers, and slot availability.`;

    const targetWhatsAppPhone = targetBranch.whatsapp;
    const whatsappUrl = `https://wa.me/${targetWhatsAppPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    return apiSuccess({
      name,
      phone: cleanPhone,
      branchName: targetBranch.name,
      branchSlug: targetBranch.slug,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error("Public inquiry error:", error);
    return apiError("Failed to process inquiry", "SERVER_ERROR", 500);
  }
}
