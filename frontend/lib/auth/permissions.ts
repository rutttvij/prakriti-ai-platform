import type { User } from "@/types/auth";

export function roleCodes(user: User | null): string[] {
  if (!user) return [];
  return user.roles.filter((role) => role.is_active).map((role) => role.code);
}

export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.is_superuser || roleCodes(user).includes("SUPER_ADMIN");
}

export function hasRole(user: User | null, roleCode: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return roleCodes(user).includes(roleCode);
}

export function hasAnyRole(user: User | null, required: string[]): boolean {
  if (!required.length) return true;
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const userRoleCodes = roleCodes(user);
  return required.some((role) => userRoleCodes.includes(role));
}

export function canViewMenuItem(user: User | null, itemRoles?: string[]): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  return hasAnyRole(user, itemRoles);
}
