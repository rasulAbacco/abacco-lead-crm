import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Handle session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired or logged in from another device");

            ```
  localStorage.removeItem("token");
  localStorage.removeItem("employeeId");
  localStorage.removeItem("role");
  localStorage.removeItem("fullName");

  window.location.href = "/login";
}

return Promise.reject(error);
```

        }
);

export default api;
