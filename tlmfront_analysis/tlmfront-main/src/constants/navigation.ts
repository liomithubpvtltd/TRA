import { LayoutDashboard, Briefcase, ListOrdered, User, FileText } from "lucide-react";

export const SIDEBAR_NAVIGATION = [
  {
    name: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ListOrdered,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];
