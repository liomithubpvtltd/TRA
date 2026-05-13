import axios, { AxiosInstance } from "axios";
import { setAccessToken, clearAccessToken, getAccessToken } from "./tokenmanager";
import { useAuthStore } from "@/store/authStore";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
//export const BASE_URL = "https://api.thetimelessmoney.com";
export const WS_URL = BASE_URL.replace(/^http/, "ws");

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let isLoggingOut = false;
let refreshQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = [];

const processQueue = (error: any = null) => {
  refreshQueue.forEach(p => (error ? p.reject(error) : p.resolve()));
  refreshQueue = [];
};

class ApiModule {
  public client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: process.env.NODE_ENV === "development" ? 0 : 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  setAuthTokens(access: string | null) {
    this.accessToken = access;
    setAccessToken(access);
    if (access) {
      useAuthStore.getState().updateAccessToken(access);
    }
  }

  clearAuthTokens() {
    this.accessToken = null;
    clearAccessToken();
    useAuthStore.getState().clearAuth();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: any) => {
        const token = this.accessToken || getAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest: any = error.config;
        const status = error?.response?.status;
        const url: string = originalRequest?.url || "";

        const isAuthUrl =
          url.includes("/api/auth/login/") ||
          url.includes("/api/auth/register/") ||
          url.includes("/api/auth/logout/") ||
          url.includes("/api/auth/refresh/");

        if (status === 401 && (isAuthUrl || (typeof window !== "undefined" && window.location.pathname === "/login"))) {
          if (!isLoggingOut) {
            isLoggingOut = true;
            this.clearAuthAndRedirect();
          }
          return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              refreshQueue.push({
                resolve: () => resolve(this.client(originalRequest)),
                reject,
              });
            });
          }

          isRefreshing = true;

          try {
            const res = await refreshClient.post("/api/auth/refresh/");
            const newAccess = res.data?.access;
            if (!newAccess) throw new Error("No access token");

            this.setAuthTokens(newAccess);

            processQueue();
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return this.client(originalRequest);
          } catch (err) {
            processQueue(err);
            if (!isLoggingOut) {
              isLoggingOut = true;
              this.clearAuthAndRedirect();
            }
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private clearAuthAndRedirect() {
    this.clearAuthTokens();
    if (typeof window !== "undefined") {
      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.replace("/login");
      }
    }
  }

  get<T = any>(url: string, params: any = {}) { return this.client.get<T>(url, { params }); }
  post<T = any>(url: string, body: any = {}, config: any = {}) { return this.client.post<T>(url, body, config); }
  put<T = any>(url: string, body: any = {}, config: any = {}) { return this.client.put<T>(url, body, config); }
  delete<T = any>(url: string, body: any = {}, config: any = {}) { return this.client.delete<T>(url, { ...config, data: body }); }
}

export const API = new ApiModule();
export default API;
