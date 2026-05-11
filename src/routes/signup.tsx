import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    navigate({ to: "/onboarding" });
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 max-w-[768px] mx-auto">
      <div className="max-w-[420px] mx-auto">
        <Link to="/" className="text-sm text-accent">&larr; Back</Link>
        <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start your VitalMan journey.</p>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-input bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-accent font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
