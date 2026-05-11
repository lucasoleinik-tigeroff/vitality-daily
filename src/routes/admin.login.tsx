import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) { setErr(error?.message ?? "Sign-in failed"); setLoading(false); return; }
    const ok = await isAdmin(data.user.id);
    if (!ok) {
      await supabase.auth.signOut();
      setErr("This account does not have admin access.");
      setLoading(false);
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F4EFE6" }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-[14px] border" style={{ borderColor: "var(--color-border)" }}>
        <h1 className="text-xl font-bold text-primary">VitalMan Admin</h1>
        <p className="text-sm mt-1" style={{ color: "#6B6760" }}>Sign in with an admin account.</p>
        <label className="block text-xs mt-4 mb-1">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full h-10 px-3 border rounded" style={{ borderColor: "var(--color-border)" }} />
        <label className="block text-xs mt-3 mb-1">Password</label>
        <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
          className="w-full h-10 px-3 border rounded" style={{ borderColor: "var(--color-border)" }} />
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <button disabled={loading} type="submit"
          className="mt-4 w-full h-11 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
