import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) { toast.success("Cuenta creada"); navigate("/"); }
    else setError(res.error);
  };

  return (
    <div className="max-w-md mx-auto px-5 md:px-8 pt-20 pb-24">
      <h1 className="font-display text-4xl tracking-tighter font-medium text-ink-900">Crea tu cuenta</h1>
      <p className="text-ink-500 mt-2">Sigue tus pedidos y guarda tus favoritos.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" data-testid="register-form">
        <div>
          <Label htmlFor="name" className="text-xs text-ink-500 uppercase tracking-wider">Nombre</Label>
          <Input id="name" data-testid="register-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
        </div>
        <div>
          <Label htmlFor="email" className="text-xs text-ink-500 uppercase tracking-wider">Correo</Label>
          <Input id="email" type="email" data-testid="register-email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
        </div>
        <div>
          <Label htmlFor="password" className="text-xs text-ink-500 uppercase tracking-wider">Contraseña (mín. 6)</Label>
          <Input id="password" type="password" data-testid="register-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-12 rounded-xl bg-surface-soft border-transparent focus-visible:bg-white focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand" />
        </div>
        {error && <div data-testid="register-error" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
        <Button type="submit" data-testid="register-submit" disabled={loading} className="w-full rounded-full h-12 bg-ink-900 hover:bg-ink-700 text-white">
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-ink-500 text-center">
        ¿Ya tienes cuenta? <Link to="/login" className="text-brand hover:underline">Inicia sesión</Link>
      </div>
    </div>
  );
}
