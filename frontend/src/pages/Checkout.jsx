import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { api, formatPrice, formatApiErrorDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function Checkout() {
  const { user, checking } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shipping_name: user?.name || "",
    shipping_address: "",
    shipping_city: "",
    shipping_zip: "",
    payment_method: "card",
  });
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  if (checking) return <div className="max-w-3xl mx-auto p-10">Cargando…</div>;
  if (user === false) { navigate("/login?next=/checkout"); return null; }

  const shipping = subtotal > 500 ? 0 : 25;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Tu carrito está vacío"); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", form);
      setPlacedOrder(data);
      await refresh();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "No se pudo completar la orden");
    } finally { setSubmitting(false); }
  };

  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-20 pb-24 text-center" data-testid="order-confirmation">
        <div className="w-16 h-16 rounded-full bg-green-100 grid place-items-center mx-auto">
          <Check className="text-green-600" />
        </div>
        <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900 mt-6">¡Pedido confirmado!</h1>
        <p className="text-ink-500 mt-2">Te enviamos un correo a {user.email} con los detalles.</p>
        <div className="mt-8 bg-surface-soft rounded-3xl p-6 text-left">
          <div className="text-sm text-ink-500">Número de orden</div>
          <div className="font-mono text-xs text-ink-900 break-all">{placedOrder.id}</div>
          <div className="mt-4 flex justify-between font-medium"><span>Total</span><span>{formatPrice(placedOrder.total)}</span></div>
        </div>
        <div className="mt-8 flex gap-3 justify-center">
          <Button data-testid="continue-shopping" onClick={() => navigate("/")} className="rounded-full bg-ink-900 hover:bg-ink-700 text-white">Seguir comprando</Button>
          <Button variant="secondary" onClick={() => navigate("/perfil")} className="rounded-full">Mis pedidos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-12 pb-24 grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900">Checkout</h1>
        <p className="text-ink-500 mt-2">Paga seguro con los métodos más comunes.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8" data-testid="checkout-form">
          <div>
            <div className="eyebrow mb-4">Envío</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre completo" id="name" value={form.shipping_name} onChange={(v) => setForm({ ...form, shipping_name: v })} testid="checkout-name" />
              <Field label="CP" id="zip" value={form.shipping_zip} onChange={(v) => setForm({ ...form, shipping_zip: v })} testid="checkout-zip" />
              <div className="sm:col-span-2">
                <Field label="Dirección" id="address" value={form.shipping_address} onChange={(v) => setForm({ ...form, shipping_address: v })} testid="checkout-address" />
              </div>
              <Field label="Ciudad" id="city" value={form.shipping_city} onChange={(v) => setForm({ ...form, shipping_city: v })} testid="checkout-city" />
            </div>
          </div>

          <div>
            <div className="eyebrow mb-4">Método de pago</div>
            <RadioGroup value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })} className="space-y-3">
              {[
                { v: "card", label: "Tarjeta de crédito / débito" },
                { v: "paypal", label: "PayPal" },
                { v: "transfer", label: "Transferencia bancaria" },
              ].map((opt) => (
                <label key={opt.v} data-testid={`pay-${opt.v}`} className={`flex items-center gap-3 border rounded-2xl px-4 py-3 cursor-pointer transition ${form.payment_method === opt.v ? "border-ink-900 bg-surface-soft" : "border-line hover:bg-surface-soft"}`}>
                  <RadioGroupItem value={opt.v} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
            <p className="text-xs text-ink-300 mt-2">Este es un demo: no se realiza cargo real.</p>
          </div>

          <Button type="submit" disabled={submitting || items.length === 0} data-testid="place-order-btn" className="w-full rounded-full h-12 bg-ink-900 hover:bg-ink-700 text-white">
            {submitting ? "Procesando…" : `Pagar ${formatPrice(total)}`}
          </Button>
        </form>
      </div>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24 bg-surface-soft rounded-3xl p-6">
          <div className="eyebrow">Resumen</div>
          <div className="mt-4 space-y-3 max-h-[320px] overflow-auto pr-1">
            {items.map((it) => (
              <div key={it.product_id} className="flex items-center gap-3">
                <img src={it.product?.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 text-sm min-w-0">
                  <div className="font-medium truncate">{it.product?.name}</div>
                  <div className="text-xs text-ink-500">Qty {it.quantity}</div>
                </div>
                <div className="text-sm font-medium">{formatPrice((it.product?.price || 0) * it.quantity)}</div>
              </div>
            ))}
          </div>
          <hr className="my-5 border-line/60" />
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row label="Envío" value={shipping ? formatPrice(shipping) : "Gratis"} />
          <Row label="Impuestos" value={formatPrice(tax)} />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line/60">
            <div className="font-display text-lg">Total</div>
            <div className="font-semibold text-lg">{formatPrice(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, value, onChange, testid }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-ink-500 uppercase tracking-wider">{label}</Label>
      <Input id={id} data-testid={testid} required value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-white border-line focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-ink-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
