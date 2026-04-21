import React from "react";
import { Link } from "react-router-dom";
import { CATEGORY_META } from "@/lib/api";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60 bg-surface-soft">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="font-display text-xl font-semibold text-ink-900">
            Compu<span className="text-brand">Max</span>
          </Link>
          <p className="mt-3 text-sm text-ink-500 leading-relaxed">
            Computadoras y componentes diseñados para que hagas más.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3">Tienda</div>
          <ul className="space-y-2 text-sm">
            {Object.entries(CATEGORY_META).map(([k, m]) => (
              <li key={k}><Link to={m.path} className="text-ink-700 hover:text-ink-900">{m.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Ayuda</div>
          <ul className="space-y-2 text-sm text-ink-700">
            <li>Envíos y devoluciones</li>
            <li>Garantía</li>
            <li>Contáctanos</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Empresa</div>
          <ul className="space-y-2 text-sm text-ink-700">
            <li>Sobre CompuMax</li>
            <li>Tiendas</li>
            <li>Prensa</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/60">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 text-xs text-ink-500 flex flex-wrap justify-between gap-2">
          <div>© {new Date().getFullYear()} CompuMax. Todos los derechos reservados.</div>
          <div>Hecho con cuidado en LATAM.</div>
        </div>
      </div>
    </footer>
  );
}
