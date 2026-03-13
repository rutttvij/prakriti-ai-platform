import type { Uuid } from "@/types/api";

export interface Role {
  id: Uuid;
  name: string;
  code: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: Uuid;
  organization_id: Uuid | null;
  city_id: Uuid | null;
  ward_id: Uuid | null;
  zone_id: Uuid | null;
  full_name: string;
  email: string;
  phone: string | null;
  is_superuser: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
