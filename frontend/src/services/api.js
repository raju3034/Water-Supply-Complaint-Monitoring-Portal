const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const getToken = () => localStorage.getItem("jalconnect_token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
};

export const api = {
  auth: {
    login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
    getMe: () => request("/auth/me"),
    getStaff: () => request("/auth/staff"),
    getDemoCredentials: () => request("/auth/demo-credentials"),
  },

  complaints: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/complaints${query ? `?${query}` : ""}`);
    },
    getById: (id) => request(`/complaints/${id}`),
    trackPublic: (idOrPhone) => request(`/complaints/track/${encodeURIComponent(idOrPhone)}`),
    create: (complaintData) => request("/complaints", { method: "POST", body: JSON.stringify(complaintData) }),
    assign: (id, assignmentData) => request(`/complaints/${id}/assign`, { method: "PATCH", body: JSON.stringify(assignmentData) }),
    resolve: (id, resolutionData) => request(`/complaints/${id}/resolution`, { method: "PATCH", body: JSON.stringify(resolutionData) }),
    feedback: (id, feedbackData) => request(`/complaints/${id}/feedback`, { method: "PATCH", body: JSON.stringify(feedbackData) }),
    getStats: () => request("/complaints/stats"),
  },

  schedules: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/schedules${query ? `?${query}` : ""}`);
    },
    getById: (id) => request(`/schedules/${id}`),
    create: (data) => request("/schedules", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/schedules/${id}`, { method: "DELETE" }),
  },

  serviceUpdates: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/service-updates${query ? `?${query}` : ""}`);
    },
    create: (data) => request("/service-updates", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/service-updates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/service-updates/${id}`, { method: "DELETE" }),
  },

  reports: {
    getComplaintStatus: () => request("/reports/complaint-status"),
    getAreaWise: () => request("/reports/area-wise"),
    getWaterSchedule: () => request("/reports/water-schedule"),
    getResolutionTime: () => request("/reports/resolution-time"),
  },
};
