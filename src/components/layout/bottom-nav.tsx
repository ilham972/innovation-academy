"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Calendar,
  Bell,
  Settings,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: "admin" | "teacher";
  teacherId?: string;
}

export function BottomNav({ role, teacherId }: BottomNavProps) {
  const pathname = usePathname();
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    teacherId
      ? { teacherId: teacherId as any }
      : "skip"
  );

  const adminTabs = [
    { href: "/timetable", icon: Calendar, label: "Timetable" },
    { href: "/overrides", icon: CalendarClock, label: "Overrides" },
    { href: "/notifications", icon: Bell, label: "Alerts" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const teacherTabs = [
    { href: "/schedule", icon: ClipboardList, label: "Schedule" },
    { href: "/notifications", icon: Bell, label: "Alerts" },
    { href: "/profile", icon: null, label: "Profile" },
  ];

  const tabs = role === "admin" ? adminTabs : teacherTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          if (tab.label === "Profile") {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 min-w-0 flex-1",
                  isActive ? "text-primary" : "text-[#A0AEC0]"
                )}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-6 w-6",
                    },
                  }}
                />
                <span className="text-[11px] mt-0.5 truncate">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 min-w-0 flex-1",
                isActive ? "text-primary" : "text-[#A0AEC0]"
              )}
            >
              <div className="relative">
                {Icon && <Icon className="h-6 w-6" />}
                {tab.label === "Alerts" &&
                  unreadCount !== undefined &&
                  unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
              </div>
              <span className="text-[11px] mt-0.5 truncate">{tab.label}</span>
            </Link>
          );
        })}

        {role === "admin" && (
          <div className="flex flex-col items-center py-2 px-3 min-w-0 flex-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-6 w-6",
                },
              }}
            />
            <span className="text-[11px] mt-0.5 truncate text-[#A0AEC0]">Account</span>
          </div>
        )}
      </div>
    </nav>
  );
}
