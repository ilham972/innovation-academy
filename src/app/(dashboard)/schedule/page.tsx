"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export default function SchedulePage() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id ? { clerkUserId: clerkUser.id } : "skip"
  );

  const todayRef = useRef(new Date());
  const today = todayRef.current;
  const [selectedDate, setSelectedDate] = useState(today);
  const dayOfWeek = selectedDate.getDay();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const operatingDays = useQuery(api.operatingDays.getAll);

  const teacherId = currentUser?.teacherId;

  const schedule = useQuery(
    api.schedule.getTeacherScheduleForDate,
    teacherId
      ? {
          teacherId: teacherId as any,
          date: dateStr,
          dayOfWeek,
        }
      : "skip"
  );

  const teacher = useQuery(
    api.teachers.getById,
    teacherId ? { id: teacherId as any } : "skip"
  );

  const activeDays = useMemo(() => {
    if (!operatingDays) return [];
    return [...operatingDays]
      .filter((d) => d.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [operatingDays]);

  // Generate dates for the current week for day switching
  const weekDates = useMemo(() => {
    const dates: { date: Date; dayOfWeek: number }[] = [];
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay()); // Go to Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push({ date: d, dayOfWeek: i });
    }
    return dates;
  }, [today]);

  const isToday = (date: Date) =>
    format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

  const isCurrentSlotActive = (startTime: string, endTime: string) => {
    if (!isToday(selectedDate)) return false;
    const now = format(today, "HH:mm");
    return now >= startTime && now < endTime;
  };

  if (!currentUser || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1A2B3D]">My Schedule</h2>
        {teacher?.canViewFullTimetable && (
          <Link
            href="/timetable"
            className="text-sm text-primary flex items-center gap-1"
          >
            <Calendar className="h-4 w-4" /> Full Timetable
          </Link>
        )}
      </div>

      {/* Day switcher */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {weekDates
          .filter((wd) =>
            activeDays.some((ad) => ad.dayOfWeek === wd.dayOfWeek)
          )
          .map((wd) => {
            const active =
              format(wd.date, "yyyy-MM-dd") ===
              format(selectedDate, "yyyy-MM-dd");
            return (
              <button
                key={wd.dayOfWeek}
                onClick={() => setSelectedDate(wd.date)}
                className={`flex flex-col items-center px-3 py-2 rounded-2xl min-w-[52px] transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : isToday(wd.date)
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-white text-[#4A5568] border border-[#E2E8F0]"
                }`}
              >
                <span className="text-xs font-medium">
                  {DAY_SHORT_NAMES[wd.dayOfWeek]}
                </span>
                <span className="text-lg font-bold">
                  {format(wd.date, "d")}
                </span>
              </button>
            );
          })}
      </div>

      {/* Date label */}
      <p className="text-sm text-[#8494A7] mb-3">
        {format(selectedDate, "EEEE, MMMM d, yyyy")}
        {isToday(selectedDate) && (
          <span className="ml-2 text-primary font-medium">Today</span>
        )}
      </p>

      {/* Schedule */}
      {schedule === undefined ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-12 text-[#A0AEC0]">
          <p className="text-lg">No classes today!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((entry: any, index: number) => {
            const isCancelled = entry.override?.type === "cancelled";
            const hasSubstitute = entry.override?.type === "substitution";
            const isCovering = entry.isCovering;
            const isActive =
              entry.timeSlot &&
              isCurrentSlotActive(
                entry.timeSlot.startTime,
                entry.timeSlot.endTime
              );

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden ${
                  isActive ? "ring-2 ring-primary/60" : ""
                } ${isCancelled ? "opacity-60" : ""}`}
              >
                <div className="flex">
                  <div
                    className="w-1.5 flex-shrink-0"
                    style={{
                      backgroundColor: isCancelled
                        ? "#DC2626"
                        : entry.subject?.color ?? "#94a3b8",
                    }}
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className={`font-bold text-[#1A2B3D] ${isCancelled ? "line-through" : ""}`}
                        >
                          {entry.subject?.name}
                        </div>
                        <div className="text-sm text-[#8494A7]">
                          {entry.grade?.name} &middot; {entry.room?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[#2D3748]">
                          {entry.timeSlot
                            ? formatTime(entry.timeSlot.startTime)
                            : ""}
                        </div>
                        <div className="text-xs text-[#A0AEC0]">
                          {entry.timeSlot
                            ? formatTime(entry.timeSlot.endTime)
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {isActive && !isCancelled && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          Now
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="destructive" className="text-xs">
                          Cancelled
                        </Badge>
                      )}
                      {hasSubstitute && !isCovering && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                          Substitute: {entry.override?.substituteTeacher?.name}
                        </Badge>
                      )}
                      {isCovering && (
                        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                          Covering for {entry.originalTeacher?.name}
                        </Badge>
                      )}
                    </div>

                    {entry.override?.reason && (
                      <p className="text-xs text-[#A0AEC0] mt-1">
                        {entry.override.reason}
                      </p>
                    )}

                    {entry.notes && !isCancelled && (
                      <p className="text-xs text-[#A0AEC0] mt-1 italic">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
