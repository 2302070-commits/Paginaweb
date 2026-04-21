import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, ShoppingBag, Check, ChevronLeft } from "lucide-react";
import { api, formatPrice, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${slug}`),
      api.get(`/products/${slug}/reviews`),
    ])
      .then(([p, r]) => { setProduct(p.data); setReviews(r.data); })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    if (!user || user === false) { navigate(`/login?next=/producto/${slug}`); return; }
    await addItem(product.id, qty);
    toast.success(`${qty} × ${product.name} agregado`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user || user === false) { navigate(`/login?next=/producto/${slug}`); return; }
    if (comment.trim().length < 3) { toast.error("Escribe al menos 3 caracteres"); return; }
    setSubmitting(true);
    try {
      const { data: newReview } = await api.post(`/products/${slug}/reviews`, { rating, comment });
      setReviews((prev) => [newReview, ...prev]);
      setComment("");
      setRating(5);
      // Refresh product to update rating
      const { data: p } = await api.get(`/products/${slug}`);
      setProduct(p);
      toast.success("¡Gracias por tu reseña!");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Error");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="max-w-7xl mx-auto p-8">Cargando…</div>;
  if (!product) return <div className="max-w-7xl mx-auto p-8">Producto no encontrado.</div>;

  const gallery = product.gallery?.length ? product.gallery : [product.image];

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8">
      <button onClick={() => navigate(-1)} data-testid="back-btn" className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 mb-6">
        <ChevronLeft size={14} /> Volver
      </button>

      <div className="grid md:grid-cols-12 gap-10">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="aspect-[5/4] bg-surface-soft rounded-[2rem] overflow-hidden">
            <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  data-testid={`thumb-${i}`}
                  className={`w-20 h-20 rounded-xl overflow-hidden ring-2 transition ${activeImg === i ? "ring-ink-900" : "ring-transparent"}`}
                >
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sticky info */}
        <div className="md:col-span-5">
          <div className="md:sticky md:top-24">
            <div className="eyebrow">{product.brand}{product.sub_category ? ` · ${product.sub_category}` : ""}</div>
            <h1 data-testid="product-title" className="font-display text-3xl sm:text-4xl tracking-tighter font-medium text-ink-900 mt-2">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} size={14} className={n <= Math.round(product.rating) ? "fill-ink-900 text-ink-900" : "text-line"} />
                ))}
              </div>
              <span className="text-ink-700 font-medium">{Number(product.rating).toFixed(1)}</span>
              <span className="text-ink-300">· {product.rating_count} reseñas</span>
            </div>

            <p className="mt-4 text-ink-500 leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <div className="text-3xl font-semibold tracking-tight text-ink-900">{formatPrice(product.price)}</div>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <div className="text-sm text-ink-300 line-through">{formatPrice(product.compare_at_price)}</div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <Check size={14} className="text-green-600" />
              <span className="text-ink-700">{product.stock > 0 ? `${product.stock} en stock` : "Agotado"}</span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-line rounded-full">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 grid place-items-center" data-testid="qty-decrease">−</button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-10 h-10 grid place-items-center" data-testid="qty-increase">+</button>
              </div>
              <Button
                data-testid="add-to-cart-btn"
                onClick={handleAdd}
                disabled={product.stock === 0}
                className="flex-1 rounded-full bg-ink-900 hover:bg-ink-700 text-white h-12"
              >
                <ShoppingBag size={16} className="mr-2" />
                Agregar al carrito
              </Button>
            </div>

            {product.specs && Object.keys(product.specs).length > 0 && (
              <>
                <Separator className="my-8" />
                <div className="eyebrow mb-3">Especificaciones</div>
                <dl className="space-y-2 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 py-1.5 border-b border-line/40">
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="text-ink-900 text-right">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <div className="eyebrow">Reseñas</div>
        <h2 className="font-display text-3xl tracking-tight font-medium text-ink-900 mt-2">Lo que opinan nuestros clientes.</h2>

        <div className="grid md:grid-cols-12 gap-10 mt-8">
          <form onSubmit={submitReview} className="md:col-span-5 bg-surface-soft rounded-3xl p-6" data-testid="review-form">
            <div className="eyebrow mb-3">Tu reseña</div>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  data-testid={`star-${n}`}
                  onClick={() => setRating(n)}
                >
                  <Star size={22} className={n <= rating ? "fill-ink-900 text-ink-900" : "text-line"} />
                </button>
              ))}
            </div>
            <Textarea
              data-testid="review-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció?"
              className="bg-white border-line rounded-2xl min-h-[120px]"
            />
            <Button type="submit" data-testid="submit-review-btn" disabled={submitting} className="mt-4 rounded-full bg-ink-900 hover:bg-ink-700 text-white">
              {submitting ? "Enviando…" : user && user !== false ? "Publicar reseña" : "Inicia sesión para reseñar"}
            </Button>
          </form>

          <div className="md:col-span-7 space-y-5">
            {reviews.length === 0 && <div className="text-ink-500">Aún no hay reseñas. ¡Sé el primero!</div>}
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-line/60 rounded-3xl p-6" data-testid={`review-${r.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-ink-900">{r.user_name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} size={12} className={n <= r.rating ? "fill-ink-900 text-ink-900" : "text-line"} />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-ink-300">{new Date(r.created_at).toLocaleDateString("es-MX")}</div>
                </div>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
