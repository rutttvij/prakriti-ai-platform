export type Uuid = string;

export interface ApiErrorShape {
  message: string;
  statusCode?: number;
  detail?: unknown;
}

export interface ApiListParams {
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export type Primitive = string | number | boolean | null | undefined;

export type QueryParams = Record<string, Primitive>;
