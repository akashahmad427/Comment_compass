const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    const msg = Array.isArray(d)
      ? "Please check your inputs."
      : d || "Request failed.";
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (email, password, channel_link, phone, date_of_birth) =>
    request("/auth/register", { method: "POST", body: { email, password, channel_link, phone, date_of_birth } }),
  googleAuth: (credential) => request("/auth/google", { method: "POST", body: { credential } }),
  sendOtp: (email) => request("/auth/send-otp", { method: "POST", body: { email } }),
  verifyOtp: (email, otp) => request("/auth/verify-otp", { method: "POST", body: { email, otp } }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  verifyResetOtp: (email, otp) => request("/auth/verify-reset-otp", { method: "POST", body: { email, otp } }),
  resetPassword: (email, new_password) => request("/auth/reset-password", { method: "POST", body: { email, new_password } }),

  // Profile
  getProfile: (token) => request("/profile", { token }),
  updateProfile: (data, token) => request("/profile", { method: "PATCH", body: data, token }),
  changePassword: (current_password, new_password, token) =>
    request("/profile/change-password", { method: "POST", body: { current_password, new_password }, token }),

  // Contact
  submitContact: (data) => request("/contact", { method: "POST", body: data }),

  // Admin
  adminLogin: (email, password) => request("/admin/login", { method: "POST", body: { email, password } }),
  adminStats: (token) => request("/admin/stats", { token }),
  adminUsers: (page, search, token) => request(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`, { token }),
  adminGetUser: (id, token) => request(`/admin/users/${id}`, { token }),
  adminBlockUser: (id, token) => request(`/admin/users/${id}/block`, { method: "PATCH", token }),
  adminUnblockUser: (id, token) => request(`/admin/users/${id}/unblock`, { method: "PATCH", token }),
  adminDeleteUser: (id, token) => request(`/admin/users/${id}`, { method: "DELETE", token }),
  adminEmailUser: (data, token) => request("/admin/users/email", { method: "POST", body: data, token }),
  adminMessages: (page, status, token) => request(`/admin/messages?page=${page}&status=${status}`, { token }),
  adminReply: (data, token) => request("/admin/messages/reply", { method: "POST", body: data, token }),
  adminCloseMessage: (id, token) => request(`/admin/messages/${id}/close`, { method: "PATCH", token }),
  createAnalysis: (url, token) => request("/analyses", { method: "POST", body: { url }, token }),
  getAnalysis: (id, token) => request(`/analyses/${id}`, { token }),
  getUsage: (token) => request("/analyses/usage", { token }),
  adminSetPlan: (id, plan, days, token) => request(`/admin/users/${id}/plan`, { method: "PATCH", body: { plan, days }, token }),
  listAnalyses: (page = 1, token) => request(`/analyses?page=${page}`, { token }),
};