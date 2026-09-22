import axios from 'axios';

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In dev, it falls back to '/api' which Vite proxies to localhost:5000.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch all practices and their product lists.
 * Returns e.g. { IBM: ['Instana', 'IBM MQ', ...], AWS: ['AWS'] }
 */
export async function fetchPractices() {
  const { data } = await axios.get(`${API_BASE}/practices`);
  return data;
}

/**
 * Fetch a single product document by practice + product name.
 * Falls back to first result if exact match not found.
 * @param {string} practice
 * @param {string} product
 */
export async function fetchProduct(practice, product) {
  const { data } = await axios.get(`${API_BASE}/products`, {
    params: { practice, product },
  });
  return data[0] || null;
}

/**
 * Fetch all products (optionally filtered).
 */
export async function fetchProducts(filters = {}) {
  const { data } = await axios.get(`${API_BASE}/products`, { params: filters });
  return data;
}

/**
 * POST a competitor generation request.
 * Server responds 202 immediately; result arrives via SSE.
 * @param {string} competitorName
 * @param {string} productName
 * @param {string} practice
 * @param {string} pin
 */
export async function generateCompetitor(competitorName, productName, practice, pin) {
  const { data } = await axios.post(`${API_BASE}/competitors/generate`, {
    competitorName,
    productName,
    practice,
    pin,
  });
  return data; // { status: 'processing', jobId }
}

/**
 * POST a new product as plain JSON.
 */
export async function postProduct(productData) {
  const { data } = await axios.post(`${API_BASE}/products`, productData);
  return data;
}

/**
 * POST a product upload (form + optional file) — multipart/form-data.
 * @param {FormData} formData
 */
export async function uploadProduct(formData) {
  const { data } = await axios.post(`${API_BASE}/products/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { status: 'processing', jobId }
}

/** POST a new practice name */
export async function createPractice(practiceName, pin) {
  const { data } = await axios.post(`${API_BASE}/practices`, { practiceName, pin });
  return data;
}

/** Save manual product data.
 *  - If productData._id exists → PUT /products/:id  (update in-place, never duplicates)
 *  - Otherwise              → POST /products/manual (create new)
 */
export async function saveManualProduct(productData, pin) {
  const { _id, ...rest } = productData;
  if (_id) {
    const { data } = await axios.put(`${API_BASE}/products/${_id}`, { ...rest, pin });
    return data;
  }
  const { data } = await axios.post(`${API_BASE}/products/manual`, { ...rest, pin });
  return data;
}

/** POST AI-fill-missing for an existing product (saves immediately) */
export async function aiFillProduct(params, pin) {
  const { data } = await axios.post(`${API_BASE}/products/ai-fill`, { ...params, pin });
  return data; // { status: 'processing', jobId }
}

/** POST AI generate preview — generates data but does NOT save to DB.
 *  Result arrives via SSE event 'ai_preview'. User reviews and manually saves. */
export async function aiGeneratePreview(params, pin) {
  const { data } = await axios.post(`${API_BASE}/products/ai-generate-preview`, { ...params, pin });
  return data; // { status: 'processing', jobId }
}

/**
 * POST a single file to extract structured data from it (PDF/CSV/Excel etc.)
 * Returns { status: 'ok', data: { productName, description, keyFeatures, ... } }
 * No DB save — just extraction.
 */
export async function extractFromFile(file, pin) {
  const fd = new FormData();
  fd.append('pin', pin);
  fd.append('file', file);
  const { data } = await axios.post(`${API_BASE}/products/extract-pdf`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { status: 'ok', data: {...} }
}

/** POST a chat question to the AI Sales Coach */
export async function chatCoach({ question, productName, practice, productContext }) {
  const { data } = await axios.post(`${API_BASE}/coach/chat`, {
    question, productName, practice, productContext,
  });
  return data; // { answer }
}

/** DELETE a product by id */
export async function deleteProduct(productId, pin) {
  const { data } = await axios.delete(`${API_BASE}/products/${productId}`, { params: { pin } });
  return data;
}

/** PATCH rename a practice (updates all products in that practice) */
export async function renamePractice(oldName, newName, pin) {
  const { data } = await axios.patch(`${API_BASE}/practices/${encodeURIComponent(oldName)}`, { newName, pin });
  return data; // { status: 'ok', oldName, newName }
}

/** DELETE a practice and all its products */
export async function deletePractice(practiceName, pin) {
  const { data } = await axios.delete(`${API_BASE}/practices/${encodeURIComponent(practiceName)}`, { params: { pin } });
  return data;
}

/** Check if a practice+product combination already exists. Returns { exists: bool } */
export async function checkDuplicate(practice, product) {
  const { data } = await axios.get(`${API_BASE}/products/check-duplicate`, { params: { practice, product } });
  return data; // { exists: true/false }
}

/** Verify admin PIN against the server. Throws on wrong PIN (401). */
export async function verifyPin(pin) {
  const { data } = await axios.post(`${API_BASE}/verify-pin`, { pin });
  return data; // { status: 'ok' }
}
