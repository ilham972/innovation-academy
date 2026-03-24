"use client";

import { useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DAY_SHORT_NAMES, formatTime } from "@/lib/days";
import { Plus } from "lucide-react";

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

// ---------- Droppable Slot Zone ----------
function SlotDropZone({
  dayOfWeek,
  slotId,
  top,
  height,
  isEmpty,
  isActiveSlot,
  isDragHappening,
  onSlotClick,
}: {
  dayOfWeek: number;
  slotId: string;
  top: number;
  height: number;
  isEmpty: boolean;
  isActiveSlot: boolean;
  isDragHappening: boolean;
  onSlotClick: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${dayOfWeek}-${slotId}`,
    data: { dayOfWeek, slotId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 transition-all ${
        isOver
          ? "bg-primary/20 ring-2 ring-inset ring-primary/50 rounded"
          : isActiveSlot
            ? "bg-primary/10 ring-1 ring-inset ring-primary/30 rounded"
            : isDragHappening
              ? "ring-1 ring-inset ring-[#CBD5E0] rounded hover:bg-primary/10 hover:ring-primary/30"
              : isEmpty
                ? "group cursor-pointer hover:bg-primary/[0.06] rounded"
                : "group cursor-pointer rounded"
      }`}
      style={{ top: top + 1, height: height - 2, zIndex: isOver ? 2 : 1 }}
      onClick={onSlotClick}
    >
      {isEmpty && !isDragHappening && !isActiveSlot && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#E2E8F0]/50 flex items-center justify-center opacity-50 group-hover:opacity-100 group-hover:bg-primary/15 transition-all">
            <Plus className="h-3 w-3 text-[#94A3B8] group-hover:text-primary" />
          </div>
        </div>
      )}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-1.5 py-0.5 rounded-md bg-primary/15 text-[9px] font-semibold text-primary">
            Drop
          </div>
        </div>
      )}
      {isDragHappening && !isOver && isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Plus className="h-2.5 w-2.5 text-[#CBD5E0]" />
        </div>
      )}
    </div>
  );
}

// ---------- Draggable Entry Block ----------
function EntryBlock({
  entry,
  top,
  height,
  leftPercent,
  widthPercent,
  isActive,
  shouldIgnoreClick,
  onEntryClick,
}: {
  entry: any;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  isActive: boolean;
  shouldIgnoreClick: () => boolean;
  onEntryClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry._id,
    data: { entry, type: "entry" },
  });

  const color = entry.subject?.color ?? "#94a3b8";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute rounded-md border-l-[3px] overflow-hidden px-1 py-0.5 text-left select-none ${
        isDragging
          ? "opacity-25 shadow-none"
          : isActive
            ? "ring-2 ring-primary ring-offset-1 shadow-lg cursor-pointer"
            : "hover:shadow-lg hover:brightness-[0.97] cursor-pointer"
      }`}
      style={{
        top: top + 1,
        height: height - 2,
        left: `calc(${leftPercent}% + 1px)`,
        width: `calc(${widthPercent}% - 2px)`,
        borderLeftColor: color,
        backgroundColor: hexToRgba(color, 0.15),
        zIndex: isActive ? 30 : isDragging ? 5 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!shouldIgnoreClick()) onEntryClick();
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
}

// ---------- Main Calendar Component ----------
interface BuilderWeeklyCalendarProps {
  operatingDays: any[];
  allEntries: any[];
  allTimeSlots: any[];
  onSlotClick: (dayOfWeek: number, slotId: string) => void;
  onEntryClick: (entry: any) => void;
  activeSlotKey?: string;
  activeEntryId?: string;
  shouldIgnoreClick: () => boolean;
  isDragHappening: boolean;
  filterStartTime?: string;
  filterEndTime?: string;
}

export function BuilderWeeklyCalendar({
  operatingDays,
  allEntries,
  allTimeSlots,
  onSlotClick,
  onEntryClick,
  activeSlotKey,
  activeEntryId,
  shouldIgnoreClick,
  isDragHappening,
  filterStartTime,
  filterEndTime,
}: BuilderWeeklyCalendarProps) {
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    for (const slot of allTimeSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek]!.push(slot);
    }
    return grouped;
  }, [allTimeSlots]);

  const entriesByDayAndSlot = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const entry of allEntries) {
      const key = `${entry.dayOfWeek}-${entry.timeSlotId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key]!.push(entry);
    }
    return grouped;
  }, [allEntries]);

  const { minTime, maxTime, totalMinutes } = useMemo(() => {
    if (filterStartTime && filterEndTime) {
      const min = timeToMinutes(filterStartTime);
      const max = timeToMinutes(filterEndTime);
      return { minTime: min, maxTime: max, totalMinutes: max - min };
    }
    if (allTimeSlots.length === 0)
      return { minTime: 480, maxTime: 1020, totalMinutes: 540 };
    let min = Infinity,
      max = -Infinity;
    for (const slot of allTimeSlots) {
      const start = timeToMinutes(slot.startTime);
      const end = timeToMinutes(slot.endTime);
      if (start < min) min = start;
      if (end > max) max = end;
    }
    min = Math.floor(min / 60) * 60;
    max = Math.ceil(max / 60) * 60;
    return { minTime: min, maxTime: max, totalMinutes: max - min };
  }, [allTimeSlots, filterStartTime, filterEndTime]);

  const hourMarkers = useMemo(() => {
    const markers: { minutes: number; label: string }[] = [];
    for (
      let h = Math.floor(minTime / 60);
      h <= Math.ceil(maxTime / 60);
      h++
    ) {
      markers.push({
        minutes: h * 60,
        label: formatTime(`${h.toString().padStart(2, "0")}:00`),
      });
    }
    return markers;
  }, [minTime, maxTime]);

  if (operatingDays.length === 0) {
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
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div
        style={{
          minWidth: `${40 + operatingDays.length * 60}px`,
        }}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Header row */}
        <div
          className="grid border-b border-[#E2E8F0]"
          style={{
            gridTemplateColumns: `40px repeat(${operatingDays.length}, minmax(60px, 1fr))`,
          }}
        >
          <div className="p-1.5 bg-[#F5F7FA]" />
          {operatingDays.map((day: any) => {
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
            gridTemplateColumns: `40px repeat(${operatingDays.length}, minmax(60px, 1fr))`,
          }}
        >
          {/* Time axis */}
          <div className="relative" style={{ height: timelineHeight }}>
            {hourMarkers.map((marker) => (
              <div
                key={marker.minutes}
                className="absolute right-0 left-0 flex items-start justify-end pr-1"
                style={{
                  top: (marker.minutes - minTime) * PX_PER_MINUTE,
                }}
              >
                <span className="text-[8px] text-[#A0AEC0] font-medium -mt-1.5 leading-none">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {operatingDays.map((day: any) => {
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
                {hourMarkers.map((marker) => (
                  <div
                    key={marker.minutes}
                    className="absolute left-0 right-0 border-t border-[#F0F0F0]"
                    style={{
                      top: (marker.minutes - minTime) * PX_PER_MINUTE,
                    }}
                  />
                ))}

                {/* Slot drop zones */}
                {daySlots.map((slot: any) => {
                  const startMin = timeToMinutes(slot.startTime);
                  const endMin = timeToMinutes(slot.endTime);
                  const top = (startMin - minTime) * PX_PER_MINUTE;
                  const height = (endMin - startMin) * PX_PER_MINUTE;
                  const entryKey = `${day.dayOfWeek}-${slot._id}`;
                  const entries = entriesByDayAndSlot[entryKey] ?? [];

                  return (
                    <SlotDropZone
                      key={`zone-${slot._id}`}
                      dayOfWeek={day.dayOfWeek}
                      slotId={slot._id}
                      top={top}
                      height={height}
                      isEmpty={entries.length === 0}
                      isActiveSlot={activeSlotKey === entryKey}
                      isDragHappening={isDragHappening}
                      onSlotClick={() => {
                        if (!shouldIgnoreClick())
                          onSlotClick(day.dayOfWeek, slot._id);
                      }}
                    />
                  );
                })}

                {/* Entry blocks */}
                {daySlots.map((slot: any) => {
                  const startMin = timeToMinutes(slot.startTime);
                  const endMin = timeToMinutes(slot.endTime);
                  const top = (startMin - minTime) * PX_PER_MINUTE;
                  const height = (endMin - startMin) * PX_PER_MINUTE;
                  const entryKey = `${day.dayOfWeek}-${slot._id}`;
                  const entries = entriesByDayAndSlot[entryKey] ?? [];

                  return entries.map((entry: any, idx: number) => {
                    const totalInSlot = entries.length;
                    const entryHeight = height / totalInSlot;
                    const entryTop = top + idx * entryHeight;

                    return (
                      <EntryBlock
                        key={entry._id}
                        entry={entry}
                        top={entryTop}
                        height={entryHeight}
                        leftPercent={0}
                        widthPercent={100}
                        isActive={activeEntryId === entry._id}
                        shouldIgnoreClick={shouldIgnoreClick}
                        onEntryClick={() => onEntryClick(entry)}
                      />
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
