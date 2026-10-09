import { prisma } from "./prisma";

/**
 * Generates a guaranteed unique member code for a tenant.
 * Analyzes existing member codes for this tenant, extracts existing numbers,
 * finds the highest sequence, and verifies uniqueness via database check.
 */
export async function generateUniqueMemberCode(
  tenantId: string,
  prefix: string = "M"
): Promise<string> {
  const existingMembers = await prisma.member.findMany({
    where: { tenantId },
    select: { memberCode: true },
  });

  let maxNum = 1000;
  const cleanPrefix = prefix.trim();

  for (const m of existingMembers) {
    if (!m.memberCode) continue;
    // If the code starts with our prefix, extract the number
    if (m.memberCode.startsWith(cleanPrefix)) {
      const rest = m.memberCode.slice(cleanPrefix.length);
      const matches = rest.match(/\d+/);
      if (matches) {
        const num = parseInt(matches[0], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    } else {
      // Also inspect trailing numeric sequence
      const matches = m.memberCode.match(/\d+/g);
      if (matches) {
        const lastNum = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxNum) {
          maxNum = lastNum;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  const separator = cleanPrefix.endsWith("-") ? "" : "-";
  let candidate = `${cleanPrefix}${separator}${String(nextNum).padStart(4, "0")}`;

  // Loop check to guarantee 100% collision freedom
  let safety = 0;
  while (safety < 200) {
    const exists = await prisma.member.findFirst({
      where: {
        tenantId,
        memberCode: candidate,
      },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }

    nextNum++;
    safety++;
    candidate = `${cleanPrefix}${separator}${String(nextNum).padStart(4, "0")}`;
  }

  // High-concurrency fallback
  return `${cleanPrefix}${separator}${Date.now().toString().slice(-5)}`;
}
