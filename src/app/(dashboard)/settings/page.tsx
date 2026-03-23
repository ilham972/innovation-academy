"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock,
  GraduationCap,
  BookOpen,
  Users,
  DoorOpen,
  TableProperties,
  UserCog,
  ChevronRight,
} from "lucide-react";

const settingsItems = [
  {
    href: "/settings/center",
    icon: Building2,
    label: "Center Settings",
    desc: "Name, defaults",
  },
  {
    href: "/settings/operating-days",
    icon: CalendarDays,
    label: "Operating Days",
    desc: "Active days of the week",
  },
  {
    href: "/settings/time-slots",
    icon: Clock,
    label: "Time Slots",
    desc: "Per-day slot configuration",
  },
  {
    href: "/settings/grades",
    icon: GraduationCap,
    label: "Grades",
    desc: "Class levels",
  },
  {
    href: "/settings/subjects",
    icon: BookOpen,
    label: "Subjects",
    desc: "Subjects with colors",
  },
  {
    href: "/settings/teachers",
    icon: Users,
    label: "Teachers",
    desc: "Teacher profiles & permissions",
  },
  {
    href: "/settings/rooms",
    icon: DoorOpen,
    label: "Rooms",
    desc: "Physical rooms/halls",
  },
  {
    href: "/settings/timetable-builder",
    icon: TableProperties,
    label: "Timetable Builder",
    desc: "Build the weekly schedule",
  },
  {
    href: "/settings/user-management",
    icon: UserCog,
    label: "User Management",
    desc: "Approve/reject signups",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[#1A2B3D] mb-4">Settings</h2>
      <div className="space-y-2">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:bg-[#F5F7FA] transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#1A2B3D]">{item.label}</div>
                <div className="text-sm text-[#8494A7]">{item.desc}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#CBD5E0] flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
