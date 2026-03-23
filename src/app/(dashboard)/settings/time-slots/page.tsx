"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Edit2, X, Check, Copy } from "lucide-react";
import Link from "next/link";
import { DAY_SHORT_NAMES } from "@/lib/days";
import { formatTime } from "@/lib/days";
import { toast } from "sonner";

export default function TimeSlotsPage() {
  const operatingDays = useQuery(api.operatingDays.getAll);
  const allSlots = useQuery(api.timeSlots.getAll);
  const createSlot = useMutation(api.timeSlots.create);
  const updateSlot = useMutation(api.timeSlots.update);
  const removeSlot = useMutation(api.timeSlots.remove);
  const copySlotsToOtherDays = useMutation(api.timeSlots.copyToOtherDays);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [label, setLabel] = useState("");
  const [showCopy, setShowCopy] = useState(false);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const activeDays = operatingDays
    ? [...operatingDays]
        .filter((d) => d.isActive)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];

  const daySlots = allSlots
    ? allSlots
        .filter((s) => s.dayOfWeek === selectedDay)
        .sort((a, b) => a.slotIndex - b.slotIndex)
    : [];

  const handleAdd = async () => {
    const nextIndex = daySlots.length + 1;
    await createSlot({
      dayOfWeek: selectedDay,
      slotIndex: nextIndex,
      startTime,
      endTime,
      label: label || undefined,
    });
    setShowAdd(false);
    setStartTime("08:00");
    setEndTime("09:00");
    setLabel("");
    toast.success("Time slot added");
  };

  const handleUpdate = async (id: any) => {
    const slot = daySlots.find((s) => s._id === id);
    if (!slot) return;
    await updateSlot({
      id,
      startTime,
      endTime,
      label: label || undefined,
      slotIndex: slot.slotIndex,
    });
    setEditingId(null);
    toast.success("Time slot updated");
  };

  const handleDelete = async (id: any) => {
    try {
      await removeSlot({ id });
      toast.success("Time slot deleted");
    } catch (e: any) {
      toast.error(e.message || "Cannot delete");
    }
  };

  const startEdit = (slot: any) => {
    setEditingId(slot._id);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setLabel(slot.label || "");
  };

  const handleCopy = async () => {
    if (copyTargets.length === 0) {
      toast.error("Select at least one day");
      return;
    }
    await copySlotsToOtherDays({
      fromDayOfWeek: selectedDay,
      toDays: copyTargets,
      replaceExisting,
    });
    toast.success(`Slots copied to ${copyTargets.length} day(s)`);
    setShowCopy(false);
    setCopyTargets([]);
  };

  const toggleCopyTarget = (day: number) => {
    setCopyTargets((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllOtherDays = () => {
    const others = activeDays
      .map((d) => d.dayOfWeek)
      .filter((d) => d !== selectedDay);
    setCopyTargets(others);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Time Slots</h2>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {activeDays.map((day) => (
          <button
            key={day._id}
            onClick={() => setSelectedDay(day.dayOfWeek)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === day.dayOfWeek
                ? "bg-primary text-primary-foreground"
                : "bg-white text-[#4A5568] border border-[#E2E8F0]"
            }`}
          >
            {DAY_SHORT_NAMES[day.dayOfWeek]}
          </button>
        ))}
      </div>

      {/* Slots list */}
      <div className="space-y-2 mb-4">
        {daySlots.map((slot) => (
          <div
            key={slot._id}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            {editingId === slot._id ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Label (optional)</Label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Period 1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(slot._id)}
                    className=""
                  >
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A2B3D]">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  {slot.label && (
                    <div className="text-sm text-[#8494A7]">{slot.label}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(slot)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(slot._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {daySlots.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No time slots configured for this day
          </div>
        )}
      </div>

      {/* Copy to other days */}
      {daySlots.length > 0 && !showAdd && !showCopy && (
        <Button
          variant="outline"
          onClick={() => {
            setShowCopy(true);
            selectAllOtherDays();
          }}
          className="w-full mb-3"
        >
          <Copy className="h-4 w-4 mr-2" /> Copy slots to other days
        </Button>
      )}

      {showCopy && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3 mb-3">
          <h3 className="font-medium text-[#1A2B3D] text-sm">
            Copy {daySlots.length} slot(s) from {DAY_SHORT_NAMES[selectedDay]} to:
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeDays
              .filter((d) => d.dayOfWeek !== selectedDay)
              .map((day) => {
                const isSelected = copyTargets.includes(day.dayOfWeek);
                const hasSlots = allSlots?.some((s) => s.dayOfWeek === day.dayOfWeek);
                return (
                  <button
                    key={day._id}
                    onClick={() => toggleCopyTarget(day.dayOfWeek)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-white text-[#4A5568] border-[#E2E8F0]"
                    }`}
                  >
                    {DAY_SHORT_NAMES[day.dayOfWeek]}
                    {hasSlots && <span className="ml-1 opacity-60">*</span>}
                  </button>
                );
              })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} />
              <Label className="text-xs text-[#4A5568]">Replace existing slots</Label>
            </div>
          </div>
          {allSlots?.some(
            (s) => copyTargets.includes(s.dayOfWeek)
          ) && (
            <p className="text-xs text-[#A0AEC0]">
              * = day already has slots.{" "}
              {replaceExisting
                ? "Existing unused slots will be replaced."
                : "New slots will be added alongside existing ones."}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCopy} className="flex-1">
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCopy(false);
                setCopyTargets([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Period 1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              className="flex-1"
            >
              Add Slot
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdd(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => {
            setShowAdd(true);
            // Auto-suggest next time based on last slot
            if (daySlots.length > 0) {
              const lastSlot = daySlots[daySlots.length - 1]!;
              setStartTime(lastSlot.endTime);
              const [h, m] = lastSlot.endTime.split(":").map(Number);
              const endH = (h! + 1) % 24;
              setEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
            }
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Time Slot
        </Button>
      )}
    </div>
  );
}
