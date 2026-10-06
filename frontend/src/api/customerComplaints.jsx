import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function getCustomerComplaints() {
  const response = await api.get(
    "/api/customer-complaints"
  );

  return response.data;
}

export async function getCustomerComplaintsSummary() {
  const response = await api.get(
    "/api/customer-complaints/summary"
  );

  return response.data;
}

export default api;