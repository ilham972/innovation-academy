"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

const PX_PER_MINUTE = 1.2;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WeeklyCalendar() {
  const operatingDays = useQuery(api.operatingDays.getAll);
  const allEntries = useQuery(api.timetable.getAll);
  const allTimeSlots = useQuery(api.timeSlots.getAll);
  const sessions = useQuery(api.sessions.getActive);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("home-session-tab");
    }
  );

  const selectSession = useCallback((id: string | null) => {
    setSelectedSessionId(id);
    if (id) {
      localStorage.setItem("home-session-tab", id);
    } else {
      localStorage.removeItem("home-session-tab");
    }
  }, []);

  const allActiveDays = useMemo(() => {
    if (!operatingDays) return [];
    return [...operatingDays]
      .filter((d) => d.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [operatingDays]);

  // Auto-select first session
  const activeSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    if (!selectedSessionId || selectedSessionId === "__all__") return null;
    return sessions.find((s) => s._id === selectedSessionId) ?? sessions[0]!;
  }, [sessions, selectedSessionId]);

  // Filter days based on session's configured days
  const activeDays = useMemo(() => {
    if (!activeSession?.days || activeSession.days.length === 0) return allActiveDays;
    return allActiveDays.filter((d) => activeSession.days!.includes(d.dayOfWeek));
  }, [allActiveDays, activeSession]);

  const slotsByDay = useMemo(() => {
    if (!allTimeSlots) return {};
    const grouped: Record<number, typeof allTimeSlots> = {};
    for (const slot of allTimeSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek]!.push(slot);
    }
    return grouped;
  }, [allTimeSlots]);

  const entriesByDayAndSlot = useMemo(() => {
    if (!allEntries) return {};
    const grouped: Record<string, typeof allEntries> = {};
    for (const entry of allEntries) {
      const key = `${entry.dayOfWeek}-${entry.timeSlotId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key]!.push(entry);
    }
    return grouped;
  }, [allEntries]);

  const { minTime, maxTime, totalMinutes } = useMemo(() => {
    // If a session is selected, use its time range
    if (activeSession) {
      const min = timeToMinutes(activeSession.startTime);
      const max = timeToMinutes(activeSession.endTime);
      return { minTime: min, maxTime: max, totalMinutes: max - min };
    }
    // Auto-calculate from all slots
    if (!allTimeSlots || allTimeSlots.length === 0) {
      return { minTime: 480, maxTime: 1020, totalMinutes: 540 };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const slot of allTimeSlots) {
      const start = timeToMinutes(slot.startTime);
      const end = timeToMinutes(slot.endTime);
      if (start < min) min = start;
      if (end > max) max = end;
    }
    min = Math.floor(min / 60) * 60;
    max = Math.ceil(max / 60) * 60;
    return { minTime: min, maxTime: max, totalMinutes: max - min };
  }, [allTimeSlots, activeSession]);

  const hourMarkers = useMemo(() => {
    const markers: { minutes: number; label: string }[] = [];
    const startHour = Math.floor(minTime / 60);
    const endHour = Math.ceil(maxTime / 60);
    for (let h = startHour; h <= endHour; h++) {
      markers.push({
        minutes: h * 60,
        label: formatTime(`${h.toString().padStart(2, "0")}:00`),
      });
    }
    return markers;
  }, [minTime, maxTime]);

  if (!operatingDays || !allEntries || !allTimeSlots) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activeDays.length === 0) {
    return (
      <div className="text-center py-12 text-[#A0AEC0]">
        No operating days configured
      </div>
    );
  }

  if (!allTimeSlots.length) {
    return (
      <div className="text-center py-8 text-[#A0AEC0]">
        No time slots configured
      </div>
    );
  }

  const timelineHeight = totalMinutes * PX_PER_MINUTE;
  const today = new Date().getDay();

  return (
    <div>
      {/* Session tabs */}
      {sessions && sessions.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {sessions.map((session) => (
            <button
              key={session._id}
              onClick={() => selectSession(session._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                activeSession?._id === session._id
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-[#4A5568] border border-[#E2E8F0]"
              }`}
            >
              {session.name}
            </button>
          ))}
          <button
            onClick={() => selectSession("__all__")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              !selectedSessionId || selectedSessionId === "__all__"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-[#4A5568] border border-[#E2E8F0]"
            }`}
          >
            All
          </button>
        </div>
      )}

      {/* Calendar grid - auto-fit width */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div
          style={{
            minWidth: `${40 + activeDays.length * 60}px`,
          }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Header row */}
          <div
            className="grid border-b border-[#E2E8F0]"
            style={{
              gridTemplateColumns: `40px repeat(${activeDays.length}, minmax(60px, 1fr))`,
            }}
          >
            <div className="p-1.5 bg-[#F5F7FA]" />
            {activeDays.map((day) => {
              const isToday = day.dayOfWeek === today;
              return (
                <div
                  key={day._id}
                  className={`p-1.5 text-center border-l border-[#E2E8F0] ${
                    isToday ? "bg-primary/10" : "bg-[#F5F7FA]"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      isToday ? "text-primary" : "text-[#2D3748]"
                    }`}
                  >
                    {DAY_SHORT_NAMES[day.dayOfWeek]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline body */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `40px repeat(${activeDays.length}, minmax(60px, 1fr))`,
            }}
          >
            {/* Time axis */}
            <div className="relative" style={{ height: timelineHeight }}>
              {hourMarkers.map((marker) => {
                const top = (marker.minutes - minTime) * PX_PER_MINUTE;
                return (
                  <div
                    key={marker.minutes}
                    className="absolute right-0 left-0 flex items-start justify-end pr-1"
                    style={{ top }}
                  >
                    <span className="text-[8px] text-[#A0AEC0] font-medium -mt-1.5 leading-none">
                      {marker.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {activeDays.map((day) => {
              const daySlots = slotsByDay[day.dayOfWeek] ?? [];
              const isToday = day.dayOfWeek === today;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`relative border-l border-[#E2E8F0] ${
                    isToday ? "bg-primary/[0.02]" : ""
                  }`}
                  style={{ height: timelineHeight }}
                >
                  {/* Hour grid lines */}
                  {hourMarkers.map((marker) => {
                    const top = (marker.minutes - minTime) * PX_PER_MINUTE;
                    return (
                      <div
                        key={marker.minutes}
                        className="absolute left-0 right-0 border-t border-[#F0F0F0]"
                        style={{ top }}
                      />
                    );
                  })}

                  {/* Class blocks */}
                  {daySlots.map((slot) => {
                    const startMin = timeToMinutes(slot.startTime);
                    const endMin = timeToMinutes(slot.endTime);
                    const top = (startMin - minTime) * PX_PER_MINUTE;
                    const height = (endMin - startMin) * PX_PER_MINUTE;

                    const entryKey = `${day.dayOfWeek}-${slot._id}`;
                    const entries = entriesByDayAndSlot[entryKey] ?? [];

                    if (entries.length === 0) return null;

                    return entries.map((entry, idx) => {
                      const color = entry.subject?.color ?? "#94a3b8";
                      const totalInSlot = entries.length;
                      const widthPercent =
                        totalInSlot > 1 ? 100 / totalInSlot : 100;
                      const leftPercent =
                        totalInSlot > 1 ? idx * widthPercent : 0;

                      return (
                        <div
                          key={entry._id}
                          className="absolute rounded-md border-l-[3px] overflow-hidden px-1 py-0.5 transition-shadow hover:shadow-lg hover:z-20"
                          style={{
                            top: top + 1,
                            height: height - 2,
                            left: `calc(${leftPercent}% + 1px)`,
                            width: `calc(${widthPercent}% - 2px)`,
                            borderLeftColor: color,
                            backgroundColor: hexToRgba(color, 0.12),
                            zIndex: 10,
                          }}
                        >
                          <div
                            className="text-[9px] font-bold leading-tight truncate"
                            style={{ color }}
                          >
                            {entry.subject?.name}
                          </div>
                          {height > 30 && (
                            <div className="text-[8px] text-[#64748B] leading-tight truncate">
                              {entry.grade?.name}
                            </div>
                          )}
                          {height > 42 && (
                            <div className="text-[8px] text-[#94A3B8] leading-tight truncate">
                              {entry.teacher?.name}
                            </div>
                          )}
                          {height > 54 && (
                            <div className="text-[7px] text-[#94A3B8] leading-tight truncate">
                              {entry.room?.name}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
