export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  roleCodes?: string[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
