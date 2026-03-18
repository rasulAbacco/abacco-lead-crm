import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// GET all IPs
export const fetchAllowedIPs = () =>
    axios.get(`${API_BASE_URL}/api/admin/allowed-ips`);

// ADD IP
export const createAllowedIP = (data) =>
    axios.post(`${API_BASE_URL}/api/admin/allowed-ips`, data);

// TOGGLE STATUS
export const updateIPStatus = (id, status) =>
    axios.patch(`${API_BASE_URL}/api/admin/allowed-ips/${id}/status`, { status });

// DELETE IP
export const deleteAllowedIP = (id) =>
    axios.delete(`${API_BASE_URL}/api/admin/allowed-ips/${id}`);