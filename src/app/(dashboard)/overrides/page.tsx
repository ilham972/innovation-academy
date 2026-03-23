"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/days";
import { CalendarDays, XCircle, Users, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function OverridesPage() {
  const { user: clerkUser } = useUser();
  const teachers = useQuery(api.teachers.getActive);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, "yyyy-MM-dd"));
  const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();

  const classes = useQuery(api.schedule.getClassesForDate, {
    date: selectedDate,
    dayOfWeek,
  });

  const cancelClass = useMutation(api.overrides.cancelClass);
  const assignSubstitute = useMutation(api.overrides.assignSubstitute);
  const removeOverride = useMutation(api.overrides.removeOverride);

  const [actionEntry, setActionEntry] = useState<any>(null);
  const [actionType, setActionType] = useState<"cancel" | "substitute" | null>(null);
  const [reason, setReason] = useState("");
  const [substituteTeacherId, setSubstituteTeacherId] = useState("");

  const handleCancel = async () => {
    if (!actionEntry) return;
    await cancelClass({
      timetableEntryId: actionEntry._id,
      date: selectedDate,
      reason: reason || undefined,
      createdBy: clerkUser?.id ?? "admin",
    });
    toast.success("Class cancelled");
    setActionEntry(null);
    setActionType(null);
    setReason("");
  };

  const handleSubstitute = async () => {
    if (!actionEntry || !substituteTeacherId) {
      toast.error("Please select a substitute teacher");
      return;
    }
    await assignSubstitute({
      timetableEntryId: actionEntry._id,
      date: selectedDate,
      substituteTeacherId: substituteTeacherId as any,
      reason: reason || undefined,
      createdBy: clerkUser?.id ?? "admin",
    });
    toast.success("Substitute assigned");
    setActionEntry(null);
    setActionType(null);
    setReason("");
    setSubstituteTeacherId("");
  };

  const handleRemoveOverride = async (overrideId: any) => {
    await removeOverride({ id: overrideId });
    toast.success("Override removed");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[#1A2B3D] mb-4">
        Schedule Overrides
      </h2>

      {/* Date picker */}
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-[#A0AEC0]" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white flex-1"
        />
      </div>

      <p className="text-sm text-[#8494A7] mb-3">
        {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
      </p>

      {/* Action form */}
      {actionEntry && actionType && (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-primary/20 mb-4">
          <h3 className="font-bold text-[#1A2B3D] mb-2">
            {actionType === "cancel" ? "Cancel Class" : "Assign Substitute"}
          </h3>
          <div className="text-sm text-[#4A5568] mb-3">
            {actionEntry.grade?.name} - {actionEntry.subject?.name} ({actionEntry.teacher?.name})
          </div>

          {actionType === "substitute" && (
            <div className="mb-3">
              <Label>Substitute Teacher</Label>
              <select
                value={substituteTeacherId}
                onChange={(e) => setSubstituteTeacherId(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white mt-1"
              >
                <option value="">Select teacher...</option>
                {teachers
                  ?.filter((t) => t._id !== actionEntry.teacherId)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="mb-3">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Teacher sick, Holiday..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={actionType === "cancel" ? handleCancel : handleSubstitute}
              className={`flex-1 ${
                actionType === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {actionType === "cancel" ? "Confirm Cancel" : "Assign Substitute"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActionEntry(null);
                setActionType(null);
                setReason("");
                setSubstituteTeacherId("");
              }}
              className="flex-1"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Classes list */}
      {classes === undefined ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-8 text-[#A0AEC0]">
          No classes scheduled for this date
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((entry: any) => {
            const isCancelled = entry.override?.type === "cancelled";
            const hasSubstitute = entry.override?.type === "substitution";

            return (
              <div
                key={entry._id}
                className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden ${isCancelled ? "opacity-60" : ""}`}
              >
                <div className="flex">
                  <div
                    className="w-1.5 flex-shrink-0"
                    style={{
                      backgroundColor: isCancelled
                        ? "#DC2626"
                        : hasSubstitute
                          ? "#F59E0B"
                          : entry.subject?.color ?? "#94a3b8",
                    }}
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className={`font-medium text-sm text-[#1A2B3D] ${isCancelled ? "line-through" : ""}`}
                        >
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

                    {/* Status badges */}
                    {(isCancelled || hasSubstitute) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {isCancelled && (
                          <Badge variant="destructive" className="text-xs">
                            Cancelled
                          </Badge>
                        )}
                        {hasSubstitute && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                            Sub: {entry.override?.substituteTeacher?.name}
                          </Badge>
                        )}
                        {entry.override?.reason && (
                          <span className="text-xs text-[#A0AEC0]">
                            {entry.override.reason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1.5 mt-2">
                      {entry.override ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRemoveOverride(entry.override._id)
                          }
                          className="text-xs"
                        >
                          <Undo2 className="h-3 w-3 mr-1" /> Undo
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActionEntry(entry);
                              setActionType("cancel");
                            }}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActionEntry(entry);
                              setActionType("substitute");
                            }}
                            className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <Users className="h-3 w-3 mr-1" /> Substitute
                          </Button>
                        </>
                      )}
                    </div>
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
