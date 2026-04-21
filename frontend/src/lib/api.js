import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
export const API_BASE = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Algo salió mal. Intenta de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function formatPrice(n) {
  if (n == null) return "";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export const CATEGORY_META = {
  laptops: { label: "Laptops", path: "/catalogo/laptops" },
  desktops: { label: "PC de Escritorio", path: "/catalogo/desktops" },
  gamer: { label: "PC Gamer", path: "/catalogo/gamer" },
  components: { label: "Componentes", path: "/componentes" },
};

export const SORT_OPTIONS = [
  { value: "most_purchased", label: "Más comprado" },
  { value: "best_rated", label: "Mejor calificado" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "worst_rated", label: "Peor calificado" },
];
