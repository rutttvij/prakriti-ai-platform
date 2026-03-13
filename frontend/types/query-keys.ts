export const queryKeys = {
  organizations: {
    all: ["organizations"] as const,
    list: (params?: unknown) => ["organizations", "list", params ?? {}] as const,
  },
  cities: {
    all: ["cities"] as const,
    list: (params?: unknown) => ["cities", "list", params ?? {}] as const,
  },
  wards: {
    all: ["wards"] as const,
    list: (params?: unknown) => ["wards", "list", params ?? {}] as const,
  },
  zones: {
    all: ["zones"] as const,
    list: (params?: unknown) => ["zones", "list", params ?? {}] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params?: unknown) => ["users", "list", params ?? {}] as const,
  },
  households: {
    all: ["households"] as const,
    list: (params?: unknown) => ["households", "list", params ?? {}] as const,
    detail: (id: string) => ["households", "detail", id] as const,
  },
  bulkGenerators: {
    all: ["bulk-generators"] as const,
    list: (params?: unknown) => ["bulk-generators", "list", params ?? {}] as const,
    detail: (id: string) => ["bulk-generators", "detail", id] as const,
  },
  workers: {
    all: ["workers"] as const,
    list: (params?: unknown) => ["workers", "list", params ?? {}] as const,
    detail: (id: string) => ["workers", "detail", id] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: (params?: unknown) => ["vehicles", "list", params ?? {}] as const,
  },
  routes: {
    all: ["routes"] as const,
    list: (params?: unknown) => ["routes", "list", params ?? {}] as const,
    detail: (id: string) => ["routes", "detail", id] as const,
  },
  shifts: {
    all: ["shifts"] as const,
    list: (params?: unknown) => ["shifts", "list", params ?? {}] as const,
    detail: (id: string) => ["shifts", "detail", id] as const,
  },
  routeStops: {
    all: ["route-stops"] as const,
    list: (params?: unknown) => ["route-stops", "list", params ?? {}] as const,
    detail: (id: string) => ["route-stops", "detail", id] as const,
  },
  pickupTasks: {
    all: ["pickup-tasks"] as const,
    list: (params?: unknown) => ["pickup-tasks", "list", params ?? {}] as const,
    detail: (id: string) => ["pickup-tasks", "detail", id] as const,
  },
  pickupLogs: {
    all: ["pickup-logs"] as const,
    list: (params?: unknown) => ["pickup-logs", "list", params ?? {}] as const,
    detail: (id: string) => ["pickup-logs", "detail", id] as const,
  },
  batches: {
    all: ["batches"] as const,
    list: (params?: unknown) => ["batches", "list", params ?? {}] as const,
    detail: (id: string) => ["batches", "detail", id] as const,
  },
  transfers: {
    all: ["transfers"] as const,
    list: (params?: unknown) => ["transfers", "list", params ?? {}] as const,
    detail: (id: string) => ["transfers", "detail", id] as const,
  },
  facilityReceipts: {
    all: ["facility-receipts"] as const,
    list: (params?: unknown) => ["facility-receipts", "list", params ?? {}] as const,
    detail: (id: string) => ["facility-receipts", "detail", id] as const,
  },
  processingRecords: {
    all: ["processing-records"] as const,
    list: (params?: unknown) => ["processing-records", "list", params ?? {}] as const,
    detail: (id: string) => ["processing-records", "detail", id] as const,
  },
  landfillRecords: {
    all: ["landfill-records"] as const,
    list: (params?: unknown) => ["landfill-records", "list", params ?? {}] as const,
    detail: (id: string) => ["landfill-records", "detail", id] as const,
  },
  recoveryCertificates: {
    all: ["recovery-certificates"] as const,
    list: (params?: unknown) => ["recovery-certificates", "list", params ?? {}] as const,
    detail: (id: string) => ["recovery-certificates", "detail", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    cityOverview: (params?: unknown) => ["dashboard", "city-overview", params ?? {}] as const,
    cityWardComparison: (params?: unknown) => ["dashboard", "city-ward-comparison", params ?? {}] as const,
  },
  reports: {
    all: ["reports"] as const,
    pickups: (params?: unknown) => ["reports", "pickups", params ?? {}] as const,
    workers: (params?: unknown) => ["reports", "workers", params ?? {}] as const,
    routes: (params?: unknown) => ["reports", "routes", params ?? {}] as const,
    facilities: (params?: unknown) => ["reports", "facilities", params ?? {}] as const,
    transfers: (params?: unknown) => ["reports", "transfers", params ?? {}] as const,
    bulkGenerators: (params?: unknown) => ["reports", "bulk-generators", params ?? {}] as const,
    environmentalSummary: (params?: unknown) => ["reports", "environmental-summary", params ?? {}] as const,
    carbonLedger: (params?: unknown) => ["reports", "carbon-ledger", params ?? {}] as const,
  },
  facilities: {
    all: ["facilities"] as const,
    list: (params?: unknown) => ["facilities", "list", params ?? {}] as const,
    detail: (id: string) => ["facilities", "detail", id] as const,
  },
  environmentalSummaries: {
    all: ["environmental-summaries"] as const,
    list: (params?: unknown) => ["environmental-summaries", "list", params ?? {}] as const,
    detail: (id: string) => ["environmental-summaries", "detail", id] as const,
  },
  carbonLedger: {
    all: ["carbon-ledger"] as const,
    list: (params?: unknown) => ["carbon-ledger", "list", params ?? {}] as const,
    detail: (id: string) => ["carbon-ledger", "detail", id] as const,
  },
};
