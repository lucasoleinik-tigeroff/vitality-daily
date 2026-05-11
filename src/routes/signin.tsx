import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/signin")({
  component: SignIn,
});

function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 max-w-[768px] mx-auto">
      <div className="max-w-[420px] mx-auto">
        <Link to="/" className="text-sm text-accent">&larr; Back</Link>
        <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your journey.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="text-accent font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
