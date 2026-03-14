"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LeafyGreen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { getRoleLandingPath } from "@/lib/auth/rbac";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useAuthBootstrap();

  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (token && user) {
      router.replace(getRoleLandingPath(user));
    }
  }, [isHydrated, router, token, user]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success("Login successful");
      const currentUser = useAuthStore.getState().user;
      router.replace(getRoleLandingPath(currentUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login";
      toast.error(message);
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[18%] h-80 w-80 rounded-full bg-[rgba(37,127,93,0.12)] blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] h-96 w-96 rounded-full bg-[rgba(79,115,136,0.1)] blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card hidden space-y-6 p-8 lg:block">
          <div className="space-y-3">
            <p className="micro-label">Municipal Operations Access</p>
            <h1 className="heading-font text-4xl font-semibold leading-tight text-ink">
              Unified Console for Waste Operations and Climate Reporting
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-muted">
              Securely sign in to monitor field execution, compliance workflows, facility outcomes, and environmental
              intelligence across your city ecosystem.
            </p>
            <p>
              <Link href="/" className="text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-600)]">
                Back to Public Home
              </Link>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Operational Visibility", "Track routes, shifts, and pickup progress in real time."],
              ["Lifecycle Traceability", "Follow material movement from source to recovery or disposal."],
              ["Compliance Assurance", "Maintain audit-ready records for bulk generator compliance."],
              ["Environmental Insights", "Convert waste events into measurable climate intelligence."],
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-xl border border-[rgba(51,76,91,0.15)] bg-white/70 p-4 shadow-[0_8px_20px_rgba(14,31,44,0.07)]"
              >
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="pointer-events-none absolute inset-x-6 -bottom-8 h-16 rounded-[999px] bg-[rgba(14,31,44,0.22)] blur-[26px]" />
          <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[2.2rem] bg-[radial-gradient(ellipse_at_center,rgba(31,107,79,0.12),transparent_70%)] blur-2xl" />

          <Card className="surface-card-strong relative w-full border-[rgba(31,107,79,0.2)] shadow-[0_28px_50px_rgba(14,31,44,0.16),0_10px_20px_rgba(14,31,44,0.1),inset_0_1px_0_rgba(255,255,255,0.92)]">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand-500),var(--brand-700))] text-white">
                  <LeafyGreen className="h-4 w-4" />
                </div>
                <div>
                  <p className="micro-label text-[0.58rem]">Civic Intelligence</p>
                  <Link href="/" className="heading-font text-sm font-semibold text-ink hover:text-[var(--brand-700)]">
                    Prakriti.AI
                  </Link>
                </div>
              </div>
              <CardTitle className="heading-font">Sign in to operations console</CardTitle>
              <CardDescription>Use your authorized municipal account credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="officer@city.gov" {...register("email")} />
                  {errors.email ? <p className="text-xs text-[rgb(125,39,39)]">{errors.email.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="********" {...register("password")} />
                  {errors.password ? <p className="text-xs text-[rgb(125,39,39)]">{errors.password.message}</p> : null}
                </div>
                <Button className="w-full" type="submit" disabled={isSubmitting} variant="primary">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
