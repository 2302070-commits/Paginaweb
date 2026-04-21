import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) { toast.success("¡Bienvenido!"); navigate(next); }
    else setError(res.error);
  };

  return (
    <div className="max-w-md mx-auto px-5 md:px-8 pt-20 pb-24">
      <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900">Inicia sesión</h1>
      <p className="text-ink-500 mt-2">Accede a tu cuenta para seguir comprando.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" data-testid="login-form">
        <div>
          <Label htmlFor="email" className="text-xs text-ink-500 uppercase tracking-wider">Correo</Label>
          <Input id="email" type="email" data-testid="login-email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
        </div>
        <div>
          <Label htmlFor="password" className="text-xs text-ink-500 uppercase tracking-wider">Contraseña</Label>
          <Input id="password" type="password" data-testid="login-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
        </div>
        {error && <div data-testid="login-error" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
        <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full rounded-full h-12 bg-ink-900 hover:bg-ink-700 text-white">
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-ink-500 text-center">
        ¿No tienes cuenta? <Link data-testid="go-register" to="/registro" className="text-brand hover:underline">Regístrate</Link>
      </div>
      <div className="mt-8 text-xs text-ink-300 text-center bg-surface-soft rounded-xl p-3">
        Cuenta demo: <span className="text-ink-500">test@compumax.com</span> · <span className="text-ink-500">test123</span>
      </div>
    </div>
  );
}
