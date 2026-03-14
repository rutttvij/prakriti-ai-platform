"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateCurrentUserProfile } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ProfileEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function ProfileEditorSheet({ open, onOpenChange, user }: ProfileEditorSheetProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.full_name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }, [open, user]);

  async function onSave() {
    if (!user) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }

    const isPasswordChangeRequested = currentPassword.trim() || newPassword.trim() || confirmNewPassword.trim();
    if (isPasswordChangeRequested) {
      if (!currentPassword.trim()) {
        toast.error("Current password is required to set a new password");
        return;
      }
      if (!newPassword.trim()) {
        toast.error("New password is required");
        return;
      }
      if (newPassword.trim().length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("New password and confirmation do not match");
        return;
      }
    }

    setIsSaving(true);
    try {
      const updated = await updateCurrentUserProfile({
        full_name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        ...(isPasswordChangeRequested
          ? {
              current_password: currentPassword.trim(),
              new_password: newPassword.trim(),
            }
          : {}),
      });
      setUser(updated);
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <p className="micro-label">Account</p>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-[var(--soft-border)] bg-[rgba(246,252,248,0.7)] p-3 text-xs text-ink-muted">
            Role: {user?.roles?.map((role) => role.code.replace("_", " ")).join(", ") || "N/A"}
          </div>

          <div className="rounded-xl border border-[var(--soft-border)] bg-[rgba(246,252,248,0.7)] p-3">
            <p className="micro-label mb-2">Address Details</p>
            <div className="grid gap-2 text-xs text-ink-muted">
              <p>
                <span className="font-semibold text-ink">Organization ID:</span> {user?.organization_id ?? "Not assigned"}
              </p>
              <p>
                <span className="font-semibold text-ink">City ID:</span> {user?.city_id ?? "Not assigned"}
              </p>
              <p>
                <span className="font-semibold text-ink">Ward ID:</span> {user?.ward_id ?? "Not assigned"}
              </p>
              <p>
                <span className="font-semibold text-ink">Zone ID:</span> {user?.zone_id ?? "Not assigned"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-full-name">Full Name</Label>
            <Input
              id="profile-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="rounded-xl border border-[var(--soft-border)] bg-[rgba(246,252,248,0.7)] p-3">
            <p className="micro-label mb-2">Security</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="profile-current-password">Current Password</Label>
                <Input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Required only if changing password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-new-password">New Password</Label>
                <Input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-confirm-password">Confirm New Password</Label>
                <Input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
