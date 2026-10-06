import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchCustomerComplaints() {
  const response = await axios.get(
    `${API_BASE_URL}/api/customer-complaints`
  );

  return response.data;
}

export async function fetchCustomerComplaintsSummary() {
  const response = await axios.get(
    `${API_BASE_URL}/api/customer-complaints/summary`
  );

  return response.data;
}