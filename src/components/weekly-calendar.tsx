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

  const slotsByDay = useMemo(() => {
    if (!allTimeSlots) return {};
    const grouped: Record<number, typeof allTimeSlots> = {};
    for (const slot of allTimeSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek]!.push(slot);
    }
    for (const day in grouped) {
      grouped[Number(day)]!.sort((a, b) => a.slotIndex - b.slotIndex);
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

  const maxSlots = useMemo(() => {
    let max = 0;
    for (const day of activeDays) {
      const count = slotsByDay[day.dayOfWeek]?.length ?? 0;
      if (count > max) max = count;
    }
    return max;
  }, [activeDays, slotsByDay]);

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

  // Build all grid cells as a flat array with explicit keys
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

  // Slot rows
  for (let slotIdx = 0; slotIdx < maxSlots; slotIdx++) {
    // Time label cell — use first active day that has this slot
    let timeLabel: ReactNode = null;
    for (const day of activeDays) {
      const slots = slotsByDay[day.dayOfWeek];
      if (slots && slots[slotIdx]) {
        timeLabel = (
          <>
            <span className="text-[10px] font-semibold text-[#2D3748] leading-tight">
              {formatTime(slots[slotIdx]!.startTime)}
            </span>
            <span className="text-[9px] text-[#A0AEC0] leading-tight">
              {formatTime(slots[slotIdx]!.endTime)}
            </span>
          </>
        );
        break;
      }
    }

    cells.push(
      <div
        key={`t-${slotIdx}`}
        className="bg-white p-1.5 flex flex-col items-center justify-center border-t border-[#EDF2F7]"
      >
        {timeLabel}
      </div>
    );

    // Day cells
    for (const day of activeDays) {
      const daySlots = slotsByDay[day.dayOfWeek];
      const slot = daySlots?.[slotIdx];

      if (!slot) {
        cells.push(
          <div
            key={`c-${slotIdx}-${day.dayOfWeek}`}
            className="bg-white p-1 border-t border-[#EDF2F7]"
          />
        );
        continue;
      }

      const lookupKey = `${day.dayOfWeek}-${slot._id}`;
      const entries = entriesByDayAndSlot[lookupKey] ?? [];

      cells.push(
        <div
          key={`c-${slotIdx}-${day.dayOfWeek}`}
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

      {maxSlots === 0 && (
        <div className="text-center py-8 text-[#A0AEC0]">
          No time slots configured
        </div>
      )}
    </div>
  );
}
