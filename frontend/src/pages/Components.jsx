import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, SORT_OPTIONS } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SUB_FILTERS = [
  "Todos",
  "Tarjeta Gráfica",
  "Procesador",
  "Memoria RAM",
  "Almacenamiento",
  "Motherboard",
  "Fuente de Poder",
  "Refrigeración",
  "Periféricos",
];

export default function Components() {
  const [sp, setSp] = useSearchParams();
  const sort = sp.get("sort") || "most_purchased";
  const sub = sp.get("sub") || "Todos";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { category: "components", sort, limit: 100 };
    if (sub && sub !== "Todos") params.sub_category = sub;
    api.get("/products", { params })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [sort, sub]);

  const setSub = (s) => {
    const next = new URLSearchParams(sp);
    if (s === "Todos") next.delete("sub");
    else next.set("sub", s);
    setSp(next);
  };

  const setSort = (s) => {
    const next = new URLSearchParams(sp);
    next.set("sort", s);
    setSp(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-14">
      <div className="eyebrow">Componentes</div>
      <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-medium text-ink-900 mt-2">
        Arma tu máquina.
      </h1>
      <p className="text-ink-500 mt-3 max-w-2xl">
        Desde lo más comprado y mejor calificado hasta el bargain bin. Tú eliges cómo ordenarlos.
      </p>

      {/* Sub-category chips */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {SUB_FILTERS.map((label) => {
          const active = sub === label;
          return (
            <button
              key={label}
              onClick={() => setSub(label)}
              data-testid={`sub-filter-${label}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
                active
                  ? "bg-ink-900 text-white border-ink-900"
                  : "bg-white text-ink-700 border-line hover:bg-surface-soft"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="mt-6 flex items-center justify-between border-b border-line/60 pb-5">
        <div className="text-sm text-ink-500" data-testid="components-count">
          {loading ? "Cargando…" : `${products.length} componentes`}
          {sub !== "Todos" && <Badge variant="secondary" className="ml-2 rounded-full">{sub}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-500 hidden sm:block">Ordenar por</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger data-testid="components-sort-select" className="w-[220px] rounded-full bg-surface-soft border-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} data-testid={`components-sort-${o.value}`}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
      {!loading && products.length === 0 && (
        <div className="text-center py-24 text-ink-500">No encontramos componentes con esos filtros.</div>
      )}
    </div>
  );
}
