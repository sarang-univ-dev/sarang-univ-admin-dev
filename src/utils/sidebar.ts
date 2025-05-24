import { STATIC_SIDEBAR_ITEMS } from "@/lib/constant/sidebar.constants";

export const getSidebarMenu = (retreatSlug: string) =>
  STATIC_SIDEBAR_ITEMS.map(item => ({
    ...item,
    href: `/retreat/${retreatSlug}/${item.path}`,
  }));
