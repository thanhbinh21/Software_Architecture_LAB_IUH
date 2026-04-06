import axios from 'axios';

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ========================
// ⚙️ CONFIG: Đổi IP ở đây
// Thay 'localhost' bằng IP thực của từng máy
// ========================
export const CONFIG = {
  USER_SERVICE:    'http://172.16.33.148:3001',  // 👈 IP máy Person 2
  FOOD_SERVICE:    'http://172.16.33.164:3002',  // 👈 IP máy Person 3
  ORDER_SERVICE:   'http://172.16.34.216:3003',  // 👈 IP máy Person 4
  PAYMENT_SERVICE: 'http://172.16.33.143:3004',  // 👈 IP máy Person 5
};

// User Service
export const userApi = {
  register: (data) => axios.post(`${CONFIG.USER_SERVICE}/register`, data),
  login: (data) => axios.post(`${CONFIG.USER_SERVICE}/login`, data),
};

// Food Service
export const foodApi = {
  getAll: () => axios.get(`${CONFIG.FOOD_SERVICE}/foods`),
  getById: (id) => axios.get(`${CONFIG.FOOD_SERVICE}/foods/${id}`),
  create: (data) => axios.post(`${CONFIG.FOOD_SERVICE}/foods`, data),
  update: (id, data) => axios.put(`${CONFIG.FOOD_SERVICE}/foods/${id}`, data),
  delete: (id) => axios.delete(`${CONFIG.FOOD_SERVICE}/foods/${id}`),
};

// Order Service (gửi JWT để Order service forward sang User service khi verify user)
export const orderApi = {
  create: (data) =>
    axios.post(`${CONFIG.ORDER_SERVICE}/orders`, data, { headers: authHeaders() }),
  getAll: () => axios.get(`${CONFIG.ORDER_SERVICE}/orders`, { headers: authHeaders() }),
  getById: (id) =>
    axios.get(`${CONFIG.ORDER_SERVICE}/orders/${id}`, { headers: authHeaders() }),
};

// Payment Service
export const paymentApi = {
  pay: (data) => axios.post(`${CONFIG.PAYMENT_SERVICE}/payments`, data),
};
