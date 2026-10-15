import { prisma } from "@/lib/prisma";

export interface CachedTenant {
  id: string;
  businessName: string;
  slug: string;
  currency: string;
  phone: string;
  email: string;
  address?: any;
  isActive: boolean;
  settings?: any;
}

interface CacheEntry {
  tenant: CachedTenant | null;
  cachedAt: number;
}

const TENANT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL
const tenantIdCache = new Map<string, CacheEntry>();
const tenantSlugCache = new Map<string, CacheEntry>();

function normalizeTenant(rawTenant: any): CachedTenant | null {
  if (!rawTenant) return null;
  const tenant = { ...rawTenant };
  if (tenant.settings) {
    tenant.settings = {
      ...tenant.settings,
      gstRatePercentage:
        tenant.settings.gstRatePercentage !== undefined && tenant.settings.gstRatePercentage !== null
          ? Number(tenant.settings.gstRatePercentage)
          : 18.0,
    };
  }
  return tenant as CachedTenant;
}

/**
 * High-speed In-Memory Tenant Resolver (0.01ms vs 500ms remote database trip)
 * Eliminates redundant Supabase network roundtrips on every page transition.
 */
export async function getCachedTenant(tenantId: string): Promise<CachedTenant | null> {
  if (!tenantId) return null;

  const now = Date.now();
  const cached = tenantIdCache.get(tenantId);

  if (cached && now - cached.cachedAt < TENANT_CACHE_TTL_MS) {
    return cached.tenant;
  }

  // Fetch from Prisma database
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      businessName: true,
      slug: true,
      currency: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
      settings: true,
    },
  });

  const normalized = normalizeTenant(tenant);
  const entry: CacheEntry = {
    tenant: normalized,
    cachedAt: now,
  };

  tenantIdCache.set(tenantId, entry);
  if (normalized?.slug) {
    tenantSlugCache.set(normalized.slug, entry);
  }

  return normalized;
}

/**
 * Resolves tenant by unique slug with in-memory cache
 */
export async function getCachedTenantBySlug(slug: string): Promise<CachedTenant | null> {
  if (!slug) return null;

  const now = Date.now();
  const cached = tenantSlugCache.get(slug);

  if (cached && now - cached.cachedAt < TENANT_CACHE_TTL_MS) {
    return cached.tenant;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      businessName: true,
      slug: true,
      currency: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
      settings: true,
    },
  });

  const normalized = normalizeTenant(tenant);
  const entry: CacheEntry = {
    tenant: normalized,
    cachedAt: now,
  };

  tenantSlugCache.set(slug, entry);
  if (normalized?.id) {
    tenantIdCache.set(normalized.id, entry);
  }

  return normalized;
}

/**
 * Invalidates tenant cache on settings or business name updates
 */
export function invalidateTenantCache(tenantId?: string) {
  if (tenantId) {
    const cached = tenantIdCache.get(tenantId);
    if (cached?.tenant?.slug) {
      tenantSlugCache.delete(cached.tenant.slug);
    }
    tenantIdCache.delete(tenantId);
  } else {
    tenantIdCache.clear();
    tenantSlugCache.clear();
  }
}
