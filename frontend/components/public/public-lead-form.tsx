"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeadFormMode = "contact" | "demo";

interface LeadPayload {
  name: string;
  organization: string;
  city: string;
  email: string;
  phone: string;
  useCase: string;
  message: string;
}

const EMPTY_PAYLOAD: LeadPayload = {
  name: "",
  organization: "",
  city: "",
  email: "",
  phone: "",
  useCase: "",
  message: "",
};

interface PublicLeadFormProps {
  mode: LeadFormMode;
}

export function PublicLeadForm({ mode }: PublicLeadFormProps) {
  const [form, setForm] = useState<LeadPayload>(EMPTY_PAYLOAD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "demo" ? "Request a Platform Demo" : "Contact Prakriti.AI"),
    [mode],
  );

  const submitLabel = mode === "demo" ? "Request Demo" : "Send Message";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const timestamp = new Date().toISOString();
      const storageKey = mode === "demo" ? "prakriti_public_demo_requests" : "prakriti_public_contact_requests";
      const existing = typeof window === "undefined" ? [] : JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify([{ ...form, timestamp }, ...existing].slice(0, 20)));
      }
      setSubmittedAt(timestamp);
      setForm(EMPTY_PAYLOAD);
      toast.success("Submitted successfully", {
        description: "Form is currently in placeholder mode and stored locally for integration testing.",
      });
    } catch {
      toast.error("Unable to submit right now", {
        description: "Please retry. Backend endpoint integration can be added in the next step.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {submittedAt ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Request captured at {new Date(submittedAt).toLocaleString("en-IN")}. This form is scaffolded for backend API integration.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-name`}>Name</Label>
              <Input
                id={`${mode}-name`}
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-organization`}>Organization</Label>
              <Input
                id={`${mode}-organization`}
                required
                value={form.organization}
                onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-city`}>City</Label>
              <Input
                id={`${mode}-city`}
                required
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-email`}>Email</Label>
              <Input
                id={`${mode}-email`}
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-phone`}>Phone</Label>
              <Input
                id={`${mode}-phone`}
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-use-case`}>{mode === "demo" ? "Primary Use Case" : "Topic"}</Label>
              <Input
                id={`${mode}-use-case`}
                required
                value={form.useCase}
                onChange={(event) => setForm((prev) => ({ ...prev, useCase: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${mode}-message`}>{mode === "demo" ? "Current Workflow Notes" : "Message"}</Label>
            <Textarea
              id={`${mode}-message`}
              rows={5}
              required
              placeholder={
                mode === "demo"
                  ? "Share your current waste operations workflow, team size, and demo goals."
                  : "Tell us how we can support your municipal operations or sustainability goals."
              }
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : submitLabel}
            </Button>
            <p className="text-xs text-slate-500">Live API endpoint can be connected in `PublicLeadForm.handleSubmit`.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
