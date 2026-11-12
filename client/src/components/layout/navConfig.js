import {
  LayoutDashboard, Activity, CalendarPlus, ClipboardList, ConciergeBell,
  CalendarClock, Stethoscope, Receipt,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/analytics", label: "Analytics", icon: Activity, group: "Overview", roles: ["admin"] },
  { to: "/book-appointment", label: "Book Appointment", icon: CalendarPlus, group: "Patient Care", roles: ["patient"] },
  { to: "/my-records", label: "My Records", icon: ClipboardList, group: "Patient Care", roles: ["patient"] },
  { to: "/reception", label: "Reception", icon: ConciergeBell, group: "Patient Care", roles: ["admin", "doctor"] },
  { to: "/my-availability", label: "My Availability", icon: CalendarClock, group: "Patient Care", roles: ["doctor"] },
  { to: "/people", label: "Doctors & Patients", icon: Stethoscope, group: "Hospital Admin", roles: ["admin"] },
  { to: "/bills", label: "Bills", icon: Receipt, group: "Billing" },
];

export const getNavItems = (role) =>
  NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role));

export const getNavGroups = (role) => {
  const groups = [];
  getNavItems(role).forEach((item) => {
    let g = groups.find((x) => x.label === item.group);
    if (!g) groups.push((g = { label: item.group, items: [] }));
    g.items.push(item);
  });
  return groups;
};