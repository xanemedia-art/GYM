import { NextResponse } from "next/server";

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data: T | null;
  error: {
    message: string;
    code: string;
    details?: any;
  } | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export function apiSuccess<T>(data: T, meta?: Omit<NonNullable<ApiResponseEnvelope["meta"]>, "timestamp">, status = 200) {
  const body: ApiResponseEnvelope<T> = {
    success: true,
    data,
    error: null,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(body, { status });
}

export function apiError(message: string, code = "INTERNAL_ERROR", status = 400, details?: any) {
  const body: ApiResponseEnvelope<null> = {
    success: false,
    data: null,
    error: {
      message,
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(body, { status });
}
