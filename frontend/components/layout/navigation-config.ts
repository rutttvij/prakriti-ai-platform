import type { NavigationSection } from "@/types/navigation";

export const NAV_SECTIONS: NavigationSection[] = [
  {
    title: "Administration",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR", "BULK_GENERATOR"] },
      { title: "Organizations", href: "/organizations", icon: "Building2", roleCodes: ["SUPER_ADMIN"] },
      { title: "Cities", href: "/cities", icon: "MapPinned", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN"] },
      { title: "Wards", href: "/wards", icon: "LandPlot", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER"] },
      { title: "Zones", href: "/zones", icon: "Map", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER"] },
      { title: "Users", href: "/users", icon: "Users", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN"] },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Households", href: "/households", icon: "House", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Bulk Generators", href: "/bulk-generators", icon: "Factory", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Workers", href: "/workers", icon: "HardHat", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Vehicles", href: "/vehicles", icon: "Truck", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Routes", href: "/routes", icon: "Route", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Route Stops", href: "/route-stops", icon: "GitBranch", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Shifts", href: "/shifts", icon: "ClipboardCheck", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Pickup Tasks", href: "/pickup-tasks", icon: "ClipboardList", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
      { title: "Pickup Logs", href: "/pickup-logs", icon: "ClipboardList", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"] },
    ],
  },
  {
    title: "Facilities",
    items: [
      { title: "Facilities", href: "/facilities", icon: "Factory", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
      { title: "Batches", href: "/batches", icon: "Scale", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"] },
      { title: "Transfers", href: "/transfers", icon: "Truck", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"] },
      { title: "Facility Receipts", href: "/facility-receipts", icon: "Factory", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
      { title: "Processing Records", href: "/processing-records", icon: "Factory", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
      { title: "Landfill Records", href: "/landfill-records", icon: "Factory", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
      { title: "Recovery Certificates", href: "/recovery-certificates", icon: "ShieldCheck", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
    ],
  },
  {
    title: "Environmental",
    items: [
      { title: "Environmental Summaries", href: "/environmental-summaries", icon: "Leaf", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
      { title: "Carbon Ledger", href: "/carbon-ledger", icon: "ReceiptText", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR", "AUDITOR"] },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Reports Hub", href: "/reports", icon: "BarChart3", roleCodes: ["SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"] },
    ],
  },
];
