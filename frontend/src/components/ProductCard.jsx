import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user === false) { navigate("/login"); return; }
    try {
      await addItem(product.id, 1);
      toast.success("Agregado al carrito", { description: product.name });
    } catch (err) {
      toast.error("No se pudo agregar");
    }
  };

  return (
    <Link
      to={`/producto/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group card-lift bg-surface-soft rounded-3xl p-5 flex flex-col animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-white grid place-items-center">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{product.brand}</span>
          <span className="flex items-center gap-1 text-xs text-ink-700">
            <Star size={12} className="fill-ink-900 text-ink-900" />
            {Number(product.rating).toFixed(1)}
            <span className="text-ink-300">({product.rating_count})</span>
          </span>
        </div>
        <h3 className="font-display text-lg font-medium text-ink-900 mt-1 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">{product.short_desc}</p>

        <div className="mt-4 pt-4 border-t border-line/60 flex items-end justify-between gap-2">
          <div>
            <div className="font-semibold text-ink-900">{formatPrice(product.price)}</div>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <div className="text-xs text-ink-300 line-through">{formatPrice(product.compare_at_price)}</div>
            )}
          </div>
          <button
            onClick={handleAdd}
            data-testid={`add-to-cart-${product.slug}`}
            className="w-10 h-10 grid place-items-center rounded-full bg-ink-900 text-white hover:bg-ink-700 transition active:scale-95"
            aria-label="Agregar al carrito"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
