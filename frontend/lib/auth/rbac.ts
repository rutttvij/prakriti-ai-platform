import type { User } from "@/types/auth";
import { hasAnyRole, isSuperAdmin, roleCodes } from "@/lib/auth/permissions";

export const ROLE_PRIORITY = [
  "SUPER_ADMIN",
  "CITY_ADMIN",
  "WARD_OFFICER",
  "SANITATION_SUPERVISOR",
  "PROCESSOR",
  "AUDITOR",
  "WORKER",
  "BULK_GENERATOR",
] as const;

export type AppRole = (typeof ROLE_PRIORITY)[number];

interface RouteAccessRule {
  prefix: string;
  roles: AppRole[];
}

const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { prefix: "/dashboard", roles: [...ROLE_PRIORITY] },
  { prefix: "/dashboard/super-admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/city-admin", roles: ["CITY_ADMIN"] },
  { prefix: "/dashboard/ward-officer", roles: ["WARD_OFFICER"] },
  { prefix: "/dashboard/supervisor", roles: ["SANITATION_SUPERVISOR"] },
  { prefix: "/dashboard/processor", roles: ["PROCESSOR"] },
  { prefix: "/dashboard/auditor", roles: ["AUDITOR"] },
  { prefix: "/dashboard/bulk-generator", roles: ["BULK_GENERATOR"] },
  { prefix: "/organizations", roles: ["SUPER_ADMIN"] },
  { prefix: "/cities", roles: ["SUPER_ADMIN", "CITY_ADMIN"] },
  { prefix: "/wards", roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER"] },
  { prefix: "/zones", roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER"] },
  { prefix: "/users", roles: ["SUPER_ADMIN", "CITY_ADMIN"] },
  {
    prefix: "/households",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/bulk-generators",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/workers",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/vehicles",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/routes",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/route-stops",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/shifts",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/pickup-tasks",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  {
    prefix: "/pickup-logs",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"],
  },
  { prefix: "/facilities", roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
  {
    prefix: "/batches",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/transfers",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/facility-receipts",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/processing-records",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/landfill-records",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/recovery-certificates",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/environmental-summaries",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/carbon-ledger",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"],
  },
  {
    prefix: "/reports",
    roles: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"],
  },
  { prefix: "/worker", roles: ["WORKER"] },
];

export function getPrimaryRole(user: User | null): AppRole | null {
  if (!user) return null;
  if (isSuperAdmin(user)) return "SUPER_ADMIN";
  const codes = roleCodes(user);
  for (const role of ROLE_PRIORITY) {
    if (codes.includes(role)) return role;
  }
  return null;
}

export function getRoleLandingPath(user: User | null): string {
  const role = getPrimaryRole(user);
  if (!role) return "/dashboard";
  if (role === "SUPER_ADMIN") return "/dashboard/super-admin";
  if (role === "CITY_ADMIN") return "/dashboard/city-admin";
  if (role === "WARD_OFFICER") return "/dashboard/ward-officer";
  if (role === "SANITATION_SUPERVISOR") return "/dashboard/supervisor";
  if (role === "PROCESSOR") return "/dashboard/processor";
  if (role === "AUDITOR") return "/dashboard/auditor";
  if (role === "WORKER") return "/worker";
  if (role === "BULK_GENERATOR") return "/dashboard/bulk-generator";
  return "/dashboard";
}

export function canAccessPath(user: User | null, pathname: string): boolean {
  if (!user) return false;
  const rule = [...ROUTE_ACCESS_RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((candidate) => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`));
  if (!rule) return true;
  return hasAnyRole(user, rule.roles);
}
