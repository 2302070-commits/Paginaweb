import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api, CATEGORY_META, SORT_OPTIONS } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_LABEL = {
  laptops: "Laptops",
  desktops: "PC de Escritorio",
  gamer: "PC Gamer",
};

const CATEGORY_DESCRIPTION = {
  laptops: "Portátiles para estudio, trabajo y creación. Desde ultralivianas hasta estaciones móviles.",
  desktops: "Torres, todo-en-uno y mini PCs para casa y oficina.",
  gamer: "Equipos listos para jugar en 1080p, 1440p y 4K. Desde entrada hasta el tope de gama.",
};

export default function Catalog() {
  const { category } = useParams();
  const [sp, setSp] = useSearchParams();
  const sort = sp.get("sort") || "most_purchased";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { category, sort, limit: 60 } })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [category, sort]);

  const title = CATEGORY_LABEL[category] || "Catálogo";
  const desc = CATEGORY_DESCRIPTION[category];

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-14">
      <div className="eyebrow">Catálogo</div>
      <h1 className="font-display text-4xl sm:text-5xl tracking-tighter font-medium text-ink-900 mt-2">{title}</h1>
      {desc && <p className="text-ink-500 mt-3 max-w-2xl">{desc}</p>}

      <div className="mt-8 flex items-center justify-between border-b border-line/60 pb-5">
        <div className="text-sm text-ink-500" data-testid="results-count">
          {loading ? "Cargando…" : `${products.length} productos`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-500 hidden sm:block">Ordenar por</span>
          <Select value={sort} onValueChange={(v) => setSp({ sort: v })}>
            <SelectTrigger data-testid="sort-select" className="w-[220px] rounded-full bg-surface-soft border-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} data-testid={`sort-option-${o.value}`}>
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
        <div className="text-center py-24 text-ink-500">No hay productos aún en esta categoría.</div>
      )}
    </div>
  );
}
