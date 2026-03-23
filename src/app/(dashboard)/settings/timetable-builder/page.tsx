"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
} from "lucide-react";
import Link from "next/link";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { toast } from "sonner";

type ViewMode = "day" | "teacher" | "room" | "grade";

export default function TimetableBuilderPage() {
  const operatingDays = useQuery(api.operatingDays.getAll);
  const grades = useQuery(api.grades.getActive);
  const subjects = useQuery(api.subjects.getActive);
  const teachers = useQuery(api.teachers.getActive);
  const rooms = useQuery(api.rooms.getActive);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedFilterId, setSelectedFilterId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  // Form fields
  const [formGrade, setFormGrade] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const timeSlots = useQuery(api.timeSlots.getByDay, { dayOfWeek: selectedDay });
  const dayEntries = useQuery(api.timetable.getByDay, { dayOfWeek: selectedDay });
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

  const createEntry = useMutation(api.timetable.create);
  const updateEntry = useMutation(api.timetable.update);
  const removeEntry = useMutation(api.timetable.remove);

  const activeDays = operatingDays
    ? [...operatingDays].filter((d) => d.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];

  const openAddForm = (slotId: string) => {
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
    setSelectedSlotId(entry.timeSlotId);
    setEditingEntry(entry);
    setFormGrade(entry.gradeId);
    setFormSubject(entry.subjectId);
    setFormTeacher(entry.teacherId);
    setFormRoom(entry.roomId);
    setFormNotes(entry.notes || "");
    setShowForm(true);
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
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: any) => {
    await removeEntry({ id });
    toast.success("Class removed");
    setShowForm(false);
  };

  const getEntriesForSlot = (slotId: string) => {
    return dayEntries?.filter((e) => e.timeSlotId === slotId) ?? [];
  };

  // Read-only filtered view data
  const getFilteredViewData = () => {
    let data: any[] = [];
    if (viewMode === "teacher" && teacherEntries) data = teacherEntries;
    if (viewMode === "room" && roomEntries) data = roomEntries;
    if (viewMode === "grade" && gradeEntries) data = gradeEntries;

    // Group by day
    const grouped: Record<number, any[]> = {};
    data.forEach((entry) => {
      if (!grouped[entry.dayOfWeek]) grouped[entry.dayOfWeek] = [];
      grouped[entry.dayOfWeek]!.push(entry);
    });
    return grouped;
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Timetable Builder</h2>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(["day", "teacher", "room", "grade"] as ViewMode[]).map((mode) => (
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
            By {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {viewMode === "day" ? (
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

          {/* Entry form modal */}
          {showForm && (
            <div className="bg-white rounded-2xl p-4 shadow-md border border-primary/20 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#1A2B3D]">
                  {editingEntry ? "Edit Class" : "Add Class"}
                </h3>
                <button onClick={() => setShowForm(false)}>
                  <X className="h-5 w-5 text-[#A0AEC0]" />
                </button>
              </div>

              {/* Conflict warnings */}
              {conflicts && conflicts.length > 0 && (
                <div className="mb-3 space-y-1">
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

              <div className="space-y-3">
                <div>
                  <Label>Grade</Label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select grade...</option>
                    {grades?.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select subject...</option>
                    {subjects?.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Teacher</Label>
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select teacher...</option>
                    {teachers?.map((t) => {
                      const teachesSelected =
                        formSubject && t.subjects.includes(formSubject as any);
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
                <div>
                  <Label>Room</Label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
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
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Any special notes..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                  >
                    {editingEntry ? "Update" : "Add Class"}
                  </Button>
                  {editingEntry && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(editingEntry._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Slots with entries */}
          <div className="space-y-3">
            {timeSlots?.map((slot) => {
              const entries = getEntriesForSlot(slot._id);
              return (
                <div key={slot._id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="bg-[#F5F7FA] px-4 py-2 border-b border-[#EDF2F7]">
                    <span className="font-medium text-[#2D3748] text-sm">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
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
                            backgroundColor: entry.subject?.color ?? "#94a3b8",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[#1A2B3D]">
                            {entry.grade?.name} - {entry.subject?.name}
                          </div>
                          <div className="text-xs text-[#8494A7]">
                            {entry.teacher?.name} &middot; {entry.room?.name}
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
                      onClick={() => openAddForm(slot._id)}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {entries.length > 0 ? "Add Another Class" : "Add Class"}
                    </Button>
                  </div>
                </div>
              );
            })}

            {(!timeSlots || timeSlots.length === 0) && (
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
      ) : (
        /* Filtered views (by teacher/room/grade) */
        <div>
          <div className="mb-4">
            <select
              value={selectedFilterId}
              onChange={(e) => setSelectedFilterId(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">
                Select {viewMode}...
              </option>
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
              {Object.entries(getFilteredViewData())
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

              {Object.keys(getFilteredViewData()).length === 0 && (
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
