"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { Loader2 } from "lucide-react";
import { WeeklyCalendar } from "@/components/weekly-calendar";

type ViewMode = "week" | "day" | "teacher" | "room" | "grade";

export default function TimetablePage() {
  const operatingDays = useQuery(api.operatingDays.getAll);
  const grades = useQuery(api.grades.getActive);
  const teachers = useQuery(api.teachers.getActive);
  const rooms = useQuery(api.rooms.getActive);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedFilterId, setSelectedFilterId] = useState("");

  const dayEntries = useQuery(
    api.timetable.getByDay,
    viewMode === "day" ? { dayOfWeek: selectedDay } : "skip"
  );
  const timeSlots = useQuery(
    api.timeSlots.getByDay,
    viewMode === "day" ? { dayOfWeek: selectedDay } : "skip"
  );
  const teacherEntries = useQuery(
    api.timetable.getByTeacher,
    selectedFilterId && viewMode === "teacher"
      ? { teacherId: selectedFilterId as any }
      : "skip"
  );
  const roomEntries = useQuery(
    api.timetable.getByRoom,
    selectedFilterId && viewMode === "room"
      ? { roomId: selectedFilterId as any }
      : "skip"
  );
  const gradeEntries = useQuery(
    api.timetable.getByGrade,
    selectedFilterId && viewMode === "grade"
      ? { gradeId: selectedFilterId as any }
      : "skip"
  );

  const activeDays = operatingDays
    ? [...operatingDays].filter((d) => d.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];

  const getFilteredData = () => {
    let data: any[] = [];
    if (viewMode === "teacher" && teacherEntries) data = teacherEntries;
    if (viewMode === "room" && roomEntries) data = roomEntries;
    if (viewMode === "grade" && gradeEntries) data = gradeEntries;

    const grouped: Record<number, any[]> = {};
    data.forEach((entry) => {
      if (!grouped[entry.dayOfWeek]) grouped[entry.dayOfWeek] = [];
      grouped[entry.dayOfWeek]!.push(entry);
    });
    return grouped;
  };

  const viewLabels: Record<ViewMode, string> = {
    week: "Week",
    day: "Day",
    teacher: "Teacher",
    room: "Room",
    grade: "Grade",
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[#1A2B3D] mb-4">
        Master Timetable
      </h2>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(["week", "day", "teacher", "room", "grade"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              setSelectedFilterId("");
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-white text-[#4A5568] border border-[#E2E8F0]"
            }`}
          >
            {viewLabels[mode]}
          </button>
        ))}
      </div>

      {/* Weekly calendar view */}
      {viewMode === "week" && <WeeklyCalendar />}

      {/* Day view */}
      {viewMode === "day" && (
        <>
          {/* Day selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {activeDays.map((day) => (
              <button
                key={day._id}
                onClick={() => setSelectedDay(day.dayOfWeek)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedDay === day.dayOfWeek
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-[#4A5568] border border-[#E2E8F0]"
                }`}
              >
                {DAY_SHORT_NAMES[day.dayOfWeek]}
              </button>
            ))}
          </div>

          {dayEntries === undefined ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {timeSlots?.map((slot) => {
                const entries =
                  dayEntries?.filter((e) => e.timeSlotId === slot._id) ?? [];
                return (
                  <div
                    key={slot._id}
                    className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
                  >
                    <div className="bg-[#F5F7FA] px-4 py-2 border-b border-[#EDF2F7]">
                      <span className="font-medium text-[#2D3748] text-sm">
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </span>
                      {slot.label && (
                        <span className="text-xs text-[#A0AEC0] ml-2">
                          {slot.label}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      {entries.length === 0 && (
                        <p className="text-sm text-[#A0AEC0] text-center py-1">
                          No classes
                        </p>
                      )}
                      {entries.map((entry) => (
                        <div
                          key={entry._id}
                          className="flex items-center gap-3 p-2 rounded-xl"
                        >
                          <div
                            className="w-1 h-10 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                entry.subject?.color ?? "#94a3b8",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[#1A2B3D]">
                              {entry.grade?.name} - {entry.subject?.name}
                            </div>
                            <div className="text-xs text-[#8494A7]">
                              {entry.teacher?.name} &middot;{" "}
                              {entry.room?.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(!timeSlots || timeSlots.length === 0) && (
                <div className="text-center py-8 text-[#A0AEC0]">
                  No time slots for this day
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Filter views (teacher/room/grade) */}
      {(viewMode === "teacher" || viewMode === "room" || viewMode === "grade") && (
        <div>
          <div className="mb-4">
            <select
              value={selectedFilterId}
              onChange={(e) => setSelectedFilterId(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">Select {viewMode}...</option>
              {viewMode === "teacher" &&
                teachers?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              {viewMode === "room" &&
                rooms?.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              {viewMode === "grade" &&
                grades?.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>

          {selectedFilterId && (
            <div className="space-y-4">
              {Object.entries(getFilteredData())
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([dayStr, entries]) => (
                  <div key={dayStr}>
                    <h3 className="font-bold text-[#2D3748] mb-2 text-sm">
                      {DAY_SHORT_NAMES[Number(dayStr)]}
                    </h3>
                    <div className="space-y-2">
                      {(entries as any[])
                        .sort((a, b) =>
                          (a.timeSlot?.startTime ?? "").localeCompare(
                            b.timeSlot?.startTime ?? ""
                          )
                        )
                        .map((entry: any) => (
                          <div
                            key={entry._id}
                            className="bg-white rounded-2xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center gap-3"
                          >
                            <div
                              className="w-1 h-10 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  entry.subject?.color ?? "#94a3b8",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-[#1A2B3D]">
                                {entry.grade?.name} - {entry.subject?.name}
                              </div>
                              <div className="text-xs text-[#8494A7]">
                                {entry.timeSlot
                                  ? `${formatTime(entry.timeSlot.startTime)} - ${formatTime(entry.timeSlot.endTime)}`
                                  : ""}{" "}
                                &middot; {entry.teacher?.name} &middot;{" "}
                                {entry.room?.name}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

              {Object.keys(getFilteredData()).length === 0 && (
                <div className="text-center py-8 text-[#A0AEC0]">
                  No classes found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
