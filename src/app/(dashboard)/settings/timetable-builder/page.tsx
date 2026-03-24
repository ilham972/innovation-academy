"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCenter,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { DAY_SHORT_NAMES, formatTime } from "@/lib/days";
import { toast } from "sonner";
import { BuilderWeeklyCalendar } from "@/components/builder-weekly-calendar";

type ViewMode = "week" | "day" | "teacher" | "room" | "grade";

// ---------- Drag Overlay Preview ----------
function EntryDragPreview({ entry }: { entry: any }) {
  const color = entry.subject?.color ?? "#94a3b8";
  return (
    <div
      className="px-3 py-2 rounded-lg border-l-[3px] bg-white shadow-2xl max-w-[160px]"
      style={{ borderLeftColor: color }}
    >
      <div
        className="text-xs font-bold truncate"
        style={{ color }}
      >
        {entry.subject?.name}
      </div>
      <div className="text-[10px] text-[#64748B] truncate">
        {entry.grade?.name}
      </div>
      <div className="text-[10px] text-[#94A3B8] truncate">
        {entry.teacher?.name}
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function TimetableBuilderPage() {
  // Data queries
  const operatingDays = useQuery(api.operatingDays.getAll);
  const allEntries = useQuery(api.timetable.getAll);
  const allTimeSlots = useQuery(api.timeSlots.getAll);
  const grades = useQuery(api.grades.getActive);
  const subjects = useQuery(api.subjects.getActive);
  const teachers = useQuery(api.teachers.getActive);
  const rooms = useQuery(api.rooms.getActive);
  const sessions = useQuery(api.sessions.getActive);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedFilterId, setSelectedFilterId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  // Form fields
  const [formGrade, setFormGrade] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const justDragged = useRef(false);

  // Conflict check query
  const conflicts = useQuery(
    api.timetable.checkConflicts,
    showForm && selectedSlotId && formTeacher && formRoom
      ? {
          dayOfWeek: selectedDay,
          timeSlotId: selectedSlotId as any,
          teacherId: formTeacher as any,
          roomId: formRoom as any,
          excludeEntryId: editingEntry?._id,
        }
      : "skip"
  );

  // Mutations
  const createEntry = useMutation(api.timetable.create);
  const updateEntry = useMutation(api.timetable.update);
  const removeEntry = useMutation(api.timetable.remove);
  const rescheduleEntry = useMutation(api.timetable.reschedule);

  // DnD sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 300, tolerance: 8 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Derived data
  const activeDays = useMemo(() => {
    if (!operatingDays) return [];
    return [...operatingDays]
      .filter((d) => d.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [operatingDays]);

  const dayEntries = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter((e) => e.dayOfWeek === selectedDay);
  }, [allEntries, selectedDay]);

  const dayTimeSlots = useMemo(() => {
    if (!allTimeSlots) return [];
    return allTimeSlots
      .filter((s) => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.slotIndex - b.slotIndex);
  }, [allTimeSlots, selectedDay]);

  const selectedSlotInfo = useMemo(() => {
    if (!allTimeSlots || !selectedSlotId) return null;
    return allTimeSlots.find((s) => s._id === selectedSlotId);
  }, [allTimeSlots, selectedSlotId]);

  const activeSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    if (!selectedSessionId || selectedSessionId === "__all__") return null;
    return sessions.find((s) => s._id === selectedSessionId) ?? sessions[0]!;
  }, [sessions, selectedSessionId]);

  const activeDragEntry = useMemo(() => {
    if (!activeDragId || activeDragId === "new-class" || !allEntries)
      return null;
    return allEntries.find((e) => e._id === activeDragId) ?? null;
  }, [activeDragId, allEntries]);

  // ---------- Form Handlers ----------
  const openAddForm = (dayOfWeek: number, slotId: string) => {
    setSelectedDay(dayOfWeek);
    setSelectedSlotId(slotId);
    setEditingEntry(null);
    setFormGrade("");
    setFormSubject("");
    setFormTeacher("");
    setFormRoom("");
    setFormNotes("");
    setShowForm(true);
  };

  const openEditForm = (entry: any) => {
    setSelectedDay(entry.dayOfWeek);
    setSelectedSlotId(entry.timeSlotId);
    setEditingEntry(entry);
    setFormGrade(entry.gradeId);
    setFormSubject(entry.subjectId);
    setFormTeacher(entry.teacherId);
    setFormRoom(entry.roomId);
    setFormNotes(entry.notes || "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleSave = async () => {
    if (!formGrade || !formSubject || !formTeacher || !formRoom) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editingEntry) {
        await updateEntry({
          id: editingEntry._id,
          gradeId: formGrade as any,
          subjectId: formSubject as any,
          teacherId: formTeacher as any,
          roomId: formRoom as any,
          notes: formNotes || undefined,
        });
        toast.success("Class updated");
      } else {
        await createEntry({
          dayOfWeek: selectedDay,
          timeSlotId: selectedSlotId as any,
          gradeId: formGrade as any,
          subjectId: formSubject as any,
          teacherId: formTeacher as any,
          roomId: formRoom as any,
          notes: formNotes || undefined,
        });
        toast.success("Class added");
      }
      closeForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    try {
      await removeEntry({ id: editingEntry._id });
      toast.success("Class removed");
      closeForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ---------- DnD Handlers ----------
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setIsDragActive(true);
    justDragged.current = true;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setIsDragActive(false);
    setTimeout(() => {
      justDragged.current = false;
    }, 200);

    if (!over) return;

    const dropId = over.id as string;
    if (!dropId.startsWith("slot-")) return;

    const dropData = over.data.current as {
      dayOfWeek: number;
      slotId: string;
    };

    // Dragged existing entry → reschedule
    const entry = (active.data.current as any)?.entry;
    if (!entry) return;

    // No-op if dropped on same slot
    if (
      entry.dayOfWeek === dropData.dayOfWeek &&
      entry.timeSlotId === dropData.slotId
    )
      return;

    try {
      await rescheduleEntry({
        id: entry._id,
        dayOfWeek: dropData.dayOfWeek,
        timeSlotId: dropData.slotId as any,
      });
      toast.success(`Moved to ${DAY_SHORT_NAMES[dropData.dayOfWeek]}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setIsDragActive(false);
    setTimeout(() => {
      justDragged.current = false;
    }, 200);
  };

  const shouldIgnoreClick = () => justDragged.current;

  // ---------- Filter View Helpers ----------
  const getGroupedFilteredEntries = () => {
    if (!allEntries || !selectedFilterId) return {};
    let filtered: any[] = [];
    if (viewMode === "teacher")
      filtered = allEntries.filter((e) => e.teacherId === selectedFilterId);
    if (viewMode === "room")
      filtered = allEntries.filter((e) => e.roomId === selectedFilterId);
    if (viewMode === "grade")
      filtered = allEntries.filter((e) => e.gradeId === selectedFilterId);

    const grouped: Record<number, any[]> = {};
    filtered.forEach((entry) => {
      if (!grouped[entry.dayOfWeek]) grouped[entry.dayOfWeek] = [];
      grouped[entry.dayOfWeek]!.push(entry);
    });
    return grouped;
  };

  // ---------- Loading ----------
  const isLoading =
    !operatingDays ||
    !allEntries ||
    !allTimeSlots ||
    !grades ||
    !subjects ||
    !teachers ||
    !rooms;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/settings" className="p-1">
            <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
          </Link>
          <h2 className="text-xl font-bold text-[#1A2B3D]">
            Timetable Builder
          </h2>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">
          Timetable Builder
        </h2>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(["week", "day", "teacher", "room", "grade"] as ViewMode[]).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setSelectedFilterId("");
                setShowForm(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-[#4A5568] border border-[#E2E8F0]"
              }`}
            >
              {mode === "week"
                ? "Week"
                : mode === "day"
                  ? "Day"
                  : `By ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
            </button>
          )
        )}
      </div>

      {/* ==================== WEEK VIEW ==================== */}
      {viewMode === "week" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Session tabs */}
          {sessions && sessions.length > 0 && (
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => setSelectedSessionId(session._id)}
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
                onClick={() => setSelectedSessionId("__all__")}
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

          {/* Interactive calendar */}
          <BuilderWeeklyCalendar
            operatingDays={activeDays}
            allEntries={allEntries}
            allTimeSlots={allTimeSlots}
            onSlotClick={openAddForm}
            onEntryClick={openEditForm}
            activeSlotKey={
              showForm ? `${selectedDay}-${selectedSlotId}` : undefined
            }
            activeEntryId={
              showForm && editingEntry ? editingEntry._id : undefined
            }
            shouldIgnoreClick={shouldIgnoreClick}
            isDragHappening={isDragActive}
            filterStartTime={activeSession?.startTime}
            filterEndTime={activeSession?.endTime}
          />

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeDragEntry ? (
              <EntryDragPreview entry={activeDragEntry} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ==================== DAY VIEW ==================== */}
      {viewMode === "day" && (
        <>
          {/* Day selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {activeDays.map((day) => (
              <button
                key={day._id}
                onClick={() => {
                  setSelectedDay(day.dayOfWeek);
                  setShowForm(false);
                }}
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

          {/* Slot list */}
          <div className="space-y-3">
            {dayTimeSlots.map((slot) => {
              const entries = dayEntries.filter(
                (e) => e.timeSlotId === slot._id
              );
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
                    {entries.map((entry) => (
                      <button
                        key={entry._id}
                        onClick={() => openEditForm(entry)}
                        className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7FA] transition-colors"
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
                        <Edit2 className="h-4 w-4 text-[#CBD5E0] flex-shrink-0" />
                      </button>
                    ))}
                    {entries.length === 0 && (
                      <p className="text-sm text-[#A0AEC0] text-center py-2">
                        No classes
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddForm(selectedDay, slot._id)}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {entries.length > 0 ? "Add Another Class" : "Add Class"}
                    </Button>
                  </div>
                </div>
              );
            })}

            {dayTimeSlots.length === 0 && (
              <div className="text-center py-8 text-[#A0AEC0]">
                <p>No time slots configured for this day.</p>
                <Link
                  href="/settings/time-slots"
                  className="text-primary text-sm mt-1 inline-block"
                >
                  Configure time slots
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== FILTER VIEWS ==================== */}
      {(viewMode === "teacher" ||
        viewMode === "room" ||
        viewMode === "grade") && (
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
              {Object.entries(getGroupedFilteredEntries())
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
                          <button
                            key={entry._id}
                            onClick={() => openEditForm(entry)}
                            className="w-full text-left bg-white rounded-2xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center gap-3 hover:bg-[#F5F7FA] transition-colors"
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
                            <Edit2 className="h-4 w-4 text-[#CBD5E0] flex-shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

              {Object.keys(getGroupedFilteredEntries()).length === 0 && (
                <div className="text-center py-8 text-[#A0AEC0]">
                  No classes found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== BOTTOM SHEET FORM ==================== */}
      <Sheet
        open={showForm}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[85vh]"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-1 -mb-2">
            <div className="w-10 h-1 rounded-full bg-[#D1D5DB]" />
          </div>

          <SheetHeader>
            <SheetTitle>
              {editingEntry ? "Edit Class" : "Add Class"}
            </SheetTitle>
            <SheetDescription>
              {DAY_SHORT_NAMES[selectedDay]}
              {selectedSlotInfo &&
                ` \u00B7 ${formatTime(selectedSlotInfo.startTime)} - ${formatTime(selectedSlotInfo.endTime)}`}
              {selectedSlotInfo?.label &&
                ` \u00B7 ${selectedSlotInfo.label}`}
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-6 space-y-4">
            {/* Conflict warnings */}
            {conflicts && conflicts.length > 0 && (
              <div className="space-y-1">
                {conflicts.map((warning, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-700"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Grade */}
            <div>
              <Label className="text-xs font-medium text-[#4A5568]">
                Grade
              </Label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm bg-white mt-1"
              >
                <option value="">Select grade...</option>
                {grades?.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-xs font-medium text-[#4A5568]">
                Subject
              </Label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm bg-white mt-1"
              >
                <option value="">Select subject...</option>
                {subjects?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <Label className="text-xs font-medium text-[#4A5568]">
                Teacher
              </Label>
              <select
                value={formTeacher}
                onChange={(e) => setFormTeacher(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm bg-white mt-1"
              >
                <option value="">Select teacher...</option>
                {teachers?.map((t) => {
                  const teachesSelected =
                    formSubject &&
                    t.subjects.includes(formSubject as any);
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name}
                      {teachesSelected ? " *" : ""}
                    </option>
                  );
                })}
              </select>
              {formSubject && (
                <p className="text-xs text-[#A0AEC0] mt-1">
                  * = teaches the selected subject
                </p>
              )}
            </div>

            {/* Room */}
            <div>
              <Label className="text-xs font-medium text-[#4A5568]">
                Room
              </Label>
              <select
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm bg-white mt-1"
              >
                <option value="">Select room...</option>
                {rooms?.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                    {r.capacity ? ` (Cap: ${r.capacity})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-medium text-[#4A5568]">
                Notes (optional)
              </Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any special notes..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                {editingEntry ? "Update Class" : "Add Class"}
              </Button>
              {editingEntry && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
