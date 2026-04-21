import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatPrice } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, checking, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking) return;
    if (user === false) { navigate("/login?next=/perfil"); return; }
    api.get("/orders").then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, [user, checking, navigate]);

  if (checking || !user) return <div className="max-w-3xl mx-auto p-10">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 pt-14 pb-24">
      <div className="eyebrow">Mi cuenta</div>
      <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900 mt-2">Hola, {user.name}</h1>
      <div className="text-ink-500 mt-1">{user.email}</div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-medium">Mis pedidos</h2>
          <Button variant="outline" onClick={logout} className="rounded-full" data-testid="profile-logout">Cerrar sesión</Button>
        </div>

        {loading ? (
          <div className="text-ink-500">Cargando pedidos…</div>
        ) : orders.length === 0 ? (
          <div className="bg-surface-soft rounded-3xl p-10 text-center">
            <p className="text-ink-500">Aún no tienes pedidos.</p>
            <Button onClick={() => navigate("/")} className="mt-4 rounded-full bg-ink-900 hover:bg-ink-700 text-white">Empezar a comprar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white border border-line/60 rounded-3xl p-6" data-testid={`order-${o.id}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-mono text-xs text-ink-500">#{o.id.slice(0, 8)}</div>
                    <div className="text-xs text-ink-300">{new Date(o.created_at).toLocaleString("es-MX")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs eyebrow">{o.status}</div>
                    <div className="font-semibold">{formatPrice(o.total)}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {o.items.slice(0, 5).map((it, i) => (
                    <img key={i} src={it.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-surface-soft" />
                  ))}
                  {o.items.length > 5 && <div className="w-14 h-14 rounded-lg bg-surface-soft grid place-items-center text-xs text-ink-500">+{o.items.length - 5}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
