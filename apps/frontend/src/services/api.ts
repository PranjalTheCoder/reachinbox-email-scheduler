import axios from "axios";
import type {
  ApiResponse,
  User,
  EmailJob,
  PaginatedResponse,
  ScheduleEmailsPayload,
  ScheduleResult,
  ParseCSVResult,
  HealthResponse,
  EmailEvent,
  SenderStats,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const requestUrl = typeof err.config?.url === "string" ? err.config.url : "";
      const isAuthProbe = requestUrl.includes("/auth/me");

      if (!isAuthProbe && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

// Helper to unwrap the ApiResponse envelope
function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  return promise.then((r) => {
    if (!r.data.success) throw new Error(r.data.message || "Request failed");
    return r.data.data as T;
  });
}

export const authApi = {
  getMe: () => unwrap<User>(api.get<ApiResponse<{ user: User }>>("/auth/me").then((r) => ({ data: { ...r.data, data: r.data.data?.user } as ApiResponse<User> }))),
  logout: () => api.post("/auth/logout"),
  getGoogleLoginUrl: () =>
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}/auth/google`,
};

export const emailApi = {
  scheduleEmails: (payload: ScheduleEmailsPayload) =>
    unwrap<ScheduleResult>(api.post<ApiResponse<ScheduleResult>>("/emails/schedule", payload)),

  parseCSV: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return unwrap<ParseCSVResult>(
      api.post<ApiResponse<ParseCSVResult>>("/emails/parse-csv", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  getScheduled: (page = 1, limit = 20) =>
    unwrap<PaginatedResponse<EmailJob>>(
      api.get<ApiResponse<PaginatedResponse<EmailJob>>>("/emails/scheduled", { params: { page, limit } })
    ),

  getSent: (page = 1, limit = 20) =>
    unwrap<PaginatedResponse<EmailJob>>(
      api.get<ApiResponse<PaginatedResponse<EmailJob>>>("/emails/sent", { params: { page, limit } })
    ),

  getById: (id: string) =>
    unwrap<EmailJob>(api.get<ApiResponse<EmailJob>>(`/emails/${id}`)),

  getEvents: (id: string) =>
    unwrap<EmailEvent[]>(api.get<ApiResponse<EmailEvent[]>>(`/emails/${id}/events`)),

  getStats: () =>
    unwrap<SenderStats>(api.get<ApiResponse<SenderStats>>("/emails/stats")),

  getHealth: () =>
    unwrap<HealthResponse>(api.get<ApiResponse<HealthResponse>>("/health")),
};

export default api;
