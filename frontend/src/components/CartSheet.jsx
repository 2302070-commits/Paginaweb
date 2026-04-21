import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function CartSheet() {
  const { items, open, setOpen, subtotal, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isEmpty = items.length === 0;

  const goCheckout = () => {
    setOpen(false);
    if (!user || user === false) navigate("/login?next=/checkout");
    else navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" data-testid="cart-sheet">
        <SheetHeader className="p-6 border-b border-line/60">
          <SheetTitle className="font-display text-2xl">Tu carrito</SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-surface-soft grid place-items-center mx-auto">
                <ShoppingBag className="text-ink-300" />
              </div>
              <p className="mt-4 font-display text-xl">Tu carrito está vacío</p>
              <p className="text-sm text-ink-500 mt-1">Descubre laptops, desktops y componentes.</p>
              <Button
                data-testid="empty-cart-continue"
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full bg-ink-900 hover:bg-ink-700 text-white"
              >
                Seguir comprando
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              {items.map((it) => (
                <div key={it.product_id} className="flex gap-4" data-testid={`cart-item-${it.product?.slug}`}>
                  <Link
                    to={`/producto/${it.product?.slug}`}
                    onClick={() => setOpen(false)}
                    className="shrink-0"
                  >
                    <img src={it.product?.image} alt="" className="w-20 h-20 rounded-xl object-cover bg-surface-soft" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/producto/${it.product?.slug}`} onClick={() => setOpen(false)} className="font-medium text-ink-900 text-sm leading-snug line-clamp-2">
                      {it.product?.name}
                    </Link>
                    <div className="text-xs text-ink-500 mt-0.5">{it.product?.brand}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-line rounded-full">
                        <button
                          data-testid={`qty-minus-${it.product?.slug}`}
                          onClick={() => updateItem(it.product_id, Math.max(1, it.quantity - 1))}
                          className="w-7 h-7 grid place-items-center text-ink-500 hover:text-ink-900"
                        ><Minus size={12} /></button>
                        <span className="text-sm w-6 text-center">{it.quantity}</span>
                        <button
                          data-testid={`qty-plus-${it.product?.slug}`}
                          onClick={() => updateItem(it.product_id, it.quantity + 1)}
                          className="w-7 h-7 grid place-items-center text-ink-500 hover:text-ink-900"
                        ><Plus size={12} /></button>
                      </div>
                      <div className="font-semibold text-sm">{formatPrice((it.product?.price || 0) * it.quantity)}</div>
                    </div>
                  </div>
                  <button
                    data-testid={`remove-${it.product?.slug}`}
                    onClick={() => removeItem(it.product_id)}
                    className="self-start p-1.5 text-ink-300 hover:text-red-600"
                  ><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-line/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-semibold text-lg">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-500">Impuestos y envío se calculan en el checkout.</p>
              <Button
                data-testid="go-checkout-btn"
                onClick={goCheckout}
                className="w-full rounded-full bg-ink-900 hover:bg-ink-700 text-white h-12 text-base"
              >
                Finalizar compra
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
