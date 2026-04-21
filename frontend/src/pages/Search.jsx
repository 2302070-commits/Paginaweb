import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function Search() {
  const [sp] = useSearchParams();
  const q = sp.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { search: q, limit: 60 } })
      .then(({ data }) => setResults(data))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-14">
      <div className="eyebrow">Búsqueda</div>
      <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900 mt-2">
        Resultados para “{q}”
      </h1>
      <div className="text-sm text-ink-500 mt-2" data-testid="search-results-count">
        {loading ? "Buscando…" : `${results.length} productos encontrados`}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
      {!loading && results.length === 0 && (
        <div className="text-center py-24 text-ink-500">Sin resultados. Prueba con otra palabra clave.</div>
      )}
    </div>
  );
}
