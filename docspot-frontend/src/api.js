import axios from "axios";

// Base URL of your Express backend
const BASE_URL = "http://localhost:5000/api";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Automatically attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("docspot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const loginAPI = async (email, password) => {
  const res = await axiosInstance.post("/auth/login", { email, password });
  return res.data;
};

export const registerAPI = async (name, email, password, phone) => {
  const res = await axiosInstance.post("/auth/register", { name, email, password, phone });
  return res.data;
};

// ─── USER ──────────────────────────────────────────────────────────────────
export const getMeAPI = async () => {
  const res = await axiosInstance.get("/user/me");
  return res.data;
};

export const getAllDoctorsAPI = async () => {
  const res = await axiosInstance.get("/user/all-doctors");
  return res.data;
};

export const applyDoctorAPI = async (formData) => {
  const res = await axiosInstance.post("/user/apply-doctor", formData);
  return res.data;
};

export const getNotificationsAPI = async () => {
  const res = await axiosInstance.get("/user/notifications");
  return res.data;
};

export const markNotificationsSeenAPI = async () => {
  const res = await axiosInstance.post("/user/mark-notifications-seen");
  return res.data;
};

// ─── DOCTOR ────────────────────────────────────────────────────────────────
export const getDoctorProfileAPI = async () => {
  const res = await axiosInstance.get("/doctor/profile");
  return res.data;
};

export const updateDoctorProfileAPI = async (formData) => {
  const res = await axiosInstance.put("/doctor/profile", formData);
  return res.data;
};

export const getDoctorAppointmentsAPI = async () => {
  const res = await axiosInstance.get("/doctor/appointments");
  return res.data;
};

export const updateAppointmentStatusAPI = async (appointmentId, status) => {
  const res = await axiosInstance.put(`/doctor/appointment/${appointmentId}/status`, { status });
  return res.data;
};

// ─── APPOINTMENT ───────────────────────────────────────────────────────────
export const bookAppointmentAPI = async (doctorId, date, time, documentFile) => {
  const formData = new FormData();
  formData.append("doctorId", doctorId);
  formData.append("date", date);
  formData.append("time", time);
  if (documentFile) formData.append("document", documentFile);
  const res = await axiosInstance.post("/appointment/book", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getUserAppointmentsAPI = async () => {
  const res = await axiosInstance.get("/appointment/user");
  return res.data;
};

export const cancelAppointmentAPI = async (appointmentId) => {
  const res = await axiosInstance.put(`/appointment/${appointmentId}/cancel`);
  return res.data;
};

// ─── ADMIN ─────────────────────────────────────────────────────────────────
export const getAdminStatsAPI = async () => {
  const res = await axiosInstance.get("/admin/stats");
  return res.data;
};

export const getAllUsersAPI = async () => {
  const res = await axiosInstance.get("/admin/users");
  return res.data;
};

export const getAllDoctorsAdminAPI = async () => {
  const res = await axiosInstance.get("/admin/doctors");
  return res.data;
};

export const updateDoctorStatusAPI = async (doctorId, status) => {
  const res = await axiosInstance.put(`/admin/doctor/${doctorId}/status`, { status });
  return res.data;
};

export const deleteUserAPI = async (userId) => {
  const res = await axiosInstance.delete(`/admin/user/${userId}`);
  return res.data;
};

export const deleteDoctorAPI = async (doctorId) => {
  const res = await axiosInstance.delete(`/admin/doctor/${doctorId}`);
  return res.data;
};

export const getAllAppointmentsAdminAPI = async () => {
  const res = await axiosInstance.get("/admin/appointments");
  return res.data;
};
