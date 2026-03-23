"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { Loader2 } from "lucide-react";
import { useMemo, ReactNode } from "react";

// Convert "HH:MM" to total minutes from midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

const PX_PER_MINUTE = 1.8;

export function WeeklyCalendar() {
  const operatingDays = useQuery(api.operatingDays.getAll);
  const allEntries = useQuery(api.timetable.getAll);
  const allTimeSlots = useQuery(api.timeSlots.getAll);

  const activeDays = useMemo(() => {
    if (!operatingDays) return [];
    return [...operatingDays]
      .filter((d) => d.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [operatingDays]);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    if (!allTimeSlots) return {};
    const grouped: Record<number, typeof allTimeSlots> = {};
    for (const slot of allTimeSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek]!.push(slot);
    }
    return grouped;
  }, [allTimeSlots]);

  // Group entries by day + timeSlotId
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

  // Calculate global time range across all days
  const { minTime, maxTime, totalMinutes } = useMemo(() => {
    if (!allTimeSlots || allTimeSlots.length === 0) {
      return { minTime: 480, maxTime: 1020, totalMinutes: 540 }; // 8am-5pm default
    }
    let min = Infinity;
    let max = -Infinity;
    for (const slot of allTimeSlots) {
      const start = timeToMinutes(slot.startTime);
      const end = timeToMinutes(slot.endTime);
      if (start < min) min = start;
      if (end > max) max = end;
    }
    // Round down to nearest hour for clean axis
    min = Math.floor(min / 60) * 60;
    // Round up to nearest hour
    max = Math.ceil(max / 60) * 60;
    return { minTime: min, maxTime: max, totalMinutes: max - min };
  }, [allTimeSlots]);

  // Build hour markers for the time axis
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

  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const timelineHeight = totalMinutes * PX_PER_MINUTE;
  const today = new Date().getDay();

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div
        style={{ minWidth: `${48 + activeDays.length * 120}px` }}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Header row */}
        <div
          className="grid border-b border-[#E2E8F0]"
          style={{
            gridTemplateColumns: `48px repeat(${activeDays.length}, 1fr)`,
          }}
        >
          <div className="p-2 bg-[#F5F7FA]" />
          {activeDays.map((day) => {
            const isToday = day.dayOfWeek === today;
            return (
              <div
                key={day._id}
                className={`p-2 text-center border-l border-[#E2E8F0] ${
                  isToday ? "bg-primary/10" : "bg-[#F5F7FA]"
                }`}
              >
                <span
                  className={`text-xs font-bold ${
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
            gridTemplateColumns: `48px repeat(${activeDays.length}, 1fr)`,
          }}
        >
          {/* Time axis */}
          <div className="relative" style={{ height: timelineHeight }}>
            {hourMarkers.map((marker) => {
              const top = (marker.minutes - minTime) * PX_PER_MINUTE;
              return (
                <div
                  key={marker.minutes}
                  className="absolute right-0 left-0 flex items-start justify-end pr-1.5"
                  style={{ top }}
                >
                  <span className="text-[9px] text-[#A0AEC0] font-medium -mt-1.5 leading-none">
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
                    // If multiple entries in same slot, split width
                    const totalInSlot = entries.length;
                    const widthPercent = totalInSlot > 1 ? 100 / totalInSlot : 100;
                    const leftPercent = totalInSlot > 1 ? idx * widthPercent : 0;

                    return (
                      <div
                        key={entry._id}
                        className="absolute rounded-md border-l-[3px] overflow-hidden px-1 py-0.5 transition-shadow hover:shadow-lg hover:z-20"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${leftPercent}% + 2px)`,
                          width: `calc(${widthPercent}% - 4px)`,
                          borderLeftColor: color,
                          backgroundColor: hexToRgba(color, 0.12),
                          zIndex: 10,
                        }}
                      >
                        <div
                          className="text-[10px] font-bold leading-tight truncate"
                          style={{ color }}
                        >
                          {entry.subject?.name}
                        </div>
                        {height > 40 && (
                          <div className="text-[9px] text-[#64748B] leading-tight truncate">
                            {entry.grade?.name}
                          </div>
                        )}
                        {height > 55 && (
                          <div className="text-[9px] text-[#94A3B8] leading-tight truncate">
                            {entry.teacher?.name}
                          </div>
                        )}
                        {height > 70 && (
                          <div className="text-[8px] text-[#94A3B8] leading-tight truncate">
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
  );
}
