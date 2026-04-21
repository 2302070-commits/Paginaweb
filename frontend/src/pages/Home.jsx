import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Shield, Truck } from "lucide-react";
import { api, CATEGORY_META, formatPrice } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/3ff5cd55-ae83-48e6-b624-a3f829814018/images/dc9adfd602dfcad366e8e89a7234003e6eca7192c5cabc3704ee648448b29735.png";
const GAMER_IMG = "https://static.prod-images.emergentagent.com/jobs/3ff5cd55-ae83-48e6-b624-a3f829814018/images/80f15bd1368d85d0183d94b42b7fb95c855aa696e378ced89639ad5f73e97245.png";
const COMP_IMG = "https://static.prod-images.emergentagent.com/jobs/3ff5cd55-ae83-48e6-b624-a3f829814018/images/cef8f0fef9a042b13259e59d117e4731a0c6552922a05d483e36e25c6e6574ac.png";
const DESK_IMG = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

export default function Home() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { sort: "most_purchased", limit: 8 } }).then(({ data }) => setTrending(data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-10 md:pb-20 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 animate-fade-up">
            <div className="eyebrow mb-5">Nueva Temporada · 2026</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-medium text-ink-900 leading-[1.02]">
              Computadoras
              <span className="block text-ink-300">que piensan contigo.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-ink-500 max-w-lg leading-relaxed">
              Laptops, desktops, PC gamer y componentes cuidadosamente seleccionados.
              Desde lo más comprado hasta lo mejor calificado, sin distracciones.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/catalogo/laptops"
                data-testid="hero-cta-laptops"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink-900 text-white text-sm font-medium hover:bg-ink-700 transition active:scale-95"
              >
                Explorar laptops <ArrowRight size={16} />
              </Link>
              <Link
                to="/componentes"
                data-testid="hero-cta-components"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-soft text-ink-900 text-sm font-medium hover:bg-surface-hover transition"
              >
                Ver componentes
              </Link>
            </div>
          </div>
          <div className="md:col-span-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-surface-soft">
              <img src={HERO_IMG} alt="Laptop minimalista" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Bento categories */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="eyebrow">Categorías</div>
            <h2 className="font-display text-3xl lg:text-4xl tracking-tight font-medium text-ink-900 mt-1">Encuentra tu equipo ideal.</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-12 gap-5">
          <BentoCard to="/catalogo/laptops" title="Laptops" subtitle="Ultraligeras, creadoras, estudio." image="https://images.unsplash.com/photo-1542897477-f1a0cb8e8ef0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" className="md:col-span-7 md:row-span-2 aspect-[16/10]" testid="bento-laptops" />
          <BentoCard to="/catalogo/gamer" title="PC Gamer" subtitle="Desde 1080p hasta 4K 240Hz." image={GAMER_IMG} className="md:col-span-5 aspect-[16/10]" testid="bento-gamer" />
          <BentoCard to="/catalogo/desktops" title="PC de Escritorio" subtitle="Todo-en-uno, torres y mini PCs." image={DESK_IMG} className="md:col-span-3 aspect-[16/10]" testid="bento-desktops" />
          <BentoCard to="/componentes" title="Componentes" subtitle="Ordena por lo más comprado, mejor calificado y más." image={COMP_IMG} className="md:col-span-2 aspect-[16/10]" testid="bento-components" />
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="eyebrow">Lo más comprado</div>
            <h2 className="font-display text-3xl lg:text-4xl tracking-tight font-medium text-ink-900 mt-1">Favoritos del momento.</h2>
          </div>
          <Link to="/componentes" className="text-sm text-brand hover:underline hidden sm:flex items-center gap-1" data-testid="see-all-trending">
            Ver todo <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Promise strip */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-5">
          <Promise icon={<Truck size={18} />} title="Envío gratis" desc="En órdenes mayores a $500 USD." />
          <Promise icon={<Shield size={18} />} title="Garantía oficial" desc="Respaldo de fábrica en cada equipo." />
          <Promise icon={<Cpu size={18} />} title="Asesoría experta" desc="Te ayudamos a elegir sin venderte de más." />
        </div>
      </section>
    </div>
  );
}

function BentoCard({ to, title, subtitle, image, className = "", testid }) {
  return (
    <Link
      to={to}
      data-testid={testid}
      className={`relative overflow-hidden rounded-[2rem] bg-surface-soft group ${className}`}
    >
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white">
        <div className="font-display text-xl md:text-2xl font-medium">{title}</div>
        <div className="text-sm text-white/80 mt-1 max-w-xs">{subtitle}</div>
      </div>
    </Link>
  );
}

function Promise({ icon, title, desc }) {
  return (
    <div className="bg-surface-soft rounded-3xl p-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-white grid place-items-center text-ink-900 shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-ink-900">{title}</div>
        <div className="text-sm text-ink-500">{desc}</div>
      </div>
    </div>
  );
}
