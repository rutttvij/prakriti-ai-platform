import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { getTokenFromStorage } from "@/lib/auth/token-storage";
import type { ApiErrorShape } from "@/types/api";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not defined. API requests will fail.");
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function injectToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export class ApiError extends Error {
  statusCode?: number;
  detail?: unknown;

  constructor(payload: ApiErrorShape) {
    super(payload.message);
    this.name = "ApiError";
    this.statusCode = payload.statusCode;
    this.detail = payload.detail;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: unknown }>;
    const detail = axiosError.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : axiosError.message || "Request failed";

    return new ApiError({
      message,
      statusCode: axiosError.response?.status,
      detail,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message });
  }

  return new ApiError({ message: "Unexpected error" });
}

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

apiClient.interceptors.request.use(injectToken);

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error);
    if (normalized.statusCode === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(normalized);
  },
);
