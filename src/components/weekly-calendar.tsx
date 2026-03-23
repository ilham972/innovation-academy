"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { Loader2 } from "lucide-react";
import { useMemo, ReactNode } from "react";

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

  // Index: slotId -> slot object
  const slotById = useMemo(() => {
    if (!allTimeSlots) return {};
    const map: Record<string, (typeof allTimeSlots)[number]> = {};
    for (const slot of allTimeSlots) {
      map[slot._id] = slot;
    }
    return map;
  }, [allTimeSlots]);

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

  // Build unified time rows from all days' slots, sorted by startTime then endTime
  // Each unique "startTime-endTime" combination becomes one row
  const timeRows = useMemo(() => {
    if (!allTimeSlots) return [];
    const seen = new Set<string>();
    const rows: { startTime: string; endTime: string; key: string }[] = [];

    // Collect from all active days in order
    const allSlotsSorted = [...allTimeSlots].sort((a, b) => {
      const cmp = a.startTime.localeCompare(b.startTime);
      if (cmp !== 0) return cmp;
      return a.endTime.localeCompare(b.endTime);
    });

    for (const slot of allSlotsSorted) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        rows.push({ startTime: slot.startTime, endTime: slot.endTime, key });
      }
    }

    return rows;
  }, [allTimeSlots]);

  // For each day, build a map: "startTime-endTime" -> slot
  const slotByDayAndTime = useMemo(() => {
    if (!allTimeSlots) return {};
    const map: Record<string, (typeof allTimeSlots)[number]> = {};
    for (const slot of allTimeSlots) {
      const key = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
      map[key] = slot;
    }
    return map;
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

  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const today = new Date().getDay();
  const cells: ReactNode[] = [];

  // Header row
  cells.push(
    <div key="h-time" className="bg-[#F5F7FA] p-2 flex items-center justify-center">
      <span className="text-[10px] font-medium text-[#A0AEC0] uppercase tracking-wider">
        Time
      </span>
    </div>
  );
  for (const day of activeDays) {
    const isToday = day.dayOfWeek === today;
    cells.push(
      <div
        key={`h-${day.dayOfWeek}`}
        className={`p-2 text-center ${isToday ? "bg-primary/10" : "bg-[#F5F7FA]"}`}
      >
        <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-[#2D3748]"}`}>
          {DAY_SHORT_NAMES[day.dayOfWeek]}
        </span>
      </div>
    );
  }

  // Time-based rows — each row is a unique startTime-endTime pair
  for (let rowIdx = 0; rowIdx < timeRows.length; rowIdx++) {
    const row = timeRows[rowIdx]!;

    // Time label cell
    cells.push(
      <div
        key={`t-${row.key}`}
        className="bg-white p-1.5 flex flex-col items-center justify-center border-t border-[#EDF2F7]"
      >
        <span className="text-[10px] font-semibold text-[#2D3748] leading-tight">
          {formatTime(row.startTime)}
        </span>
        <span className="text-[9px] text-[#A0AEC0] leading-tight">
          {formatTime(row.endTime)}
        </span>
      </div>
    );

    // Day cells
    for (const day of activeDays) {
      const lookupKey = `${day.dayOfWeek}-${row.startTime}-${row.endTime}`;
      const slot = slotByDayAndTime[lookupKey];

      if (!slot) {
        // This day has no slot at this time range
        cells.push(
          <div
            key={`c-${row.key}-${day.dayOfWeek}`}
            className="bg-white p-1 border-t border-[#EDF2F7]"
          />
        );
        continue;
      }

      const entryKey = `${day.dayOfWeek}-${slot._id}`;
      const entries = entriesByDayAndSlot[entryKey] ?? [];

      cells.push(
        <div
          key={`c-${row.key}-${day.dayOfWeek}`}
          className="bg-white p-1 border-t border-[#EDF2F7] min-h-[52px]"
        >
          {entries.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-[10px] text-[#CBD5E0]">&mdash;</span>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => {
                const color = entry.subject?.color ?? "#94a3b8";
                return (
                  <div
                    key={entry._id}
                    className="rounded-lg px-1.5 py-1 border-l-[3px] transition-shadow hover:shadow-md"
                    style={{
                      borderLeftColor: color,
                      backgroundColor: hexToRgba(color, 0.08),
                    }}
                  >
                    <div
                      className="text-[10px] font-bold leading-tight truncate"
                      style={{ color }}
                    >
                      {entry.subject?.name}
                    </div>
                    <div className="text-[9px] text-[#64748B] leading-tight truncate">
                      {entry.grade?.name}
                    </div>
                    <div className="text-[9px] text-[#94A3B8] leading-tight truncate">
                      {entry.teacher?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div
        className="grid gap-px bg-[#E2E8F0] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        style={{
          gridTemplateColumns: `56px repeat(${activeDays.length}, minmax(120px, 1fr))`,
          minWidth: `${56 + activeDays.length * 120}px`,
        }}
      >
        {cells}
      </div>

      {timeRows.length === 0 && (
        <div className="text-center py-8 text-[#A0AEC0]">
          No time slots configured
        </div>
      )}
    </div>
  );
}
