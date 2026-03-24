"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatTime } from "@/lib/days";

export default function SessionsPage() {
  const sessions = useQuery(api.sessions.getAll);
  const createSession = useMutation(api.sessions.create);
  const updateSession = useMutation(api.sessions.update);
  const removeSession = useMutation(api.sessions.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const handleAdd = async () => {
    if (!name || !startTime || !endTime) {
      toast.error("Please fill all fields");
      return;
    }
    await createSession({
      name,
      startTime,
      endTime,
      sortOrder: Number(sortOrder) || (sessions?.length ?? 0),
    });
    setShowAdd(false);
    setName("");
    setStartTime("");
    setEndTime("");
    setSortOrder("0");
    toast.success("Session added");
  };

  const handleUpdate = async (id: any) => {
    if (!name || !startTime || !endTime) {
      toast.error("Please fill all fields");
      return;
    }
    await updateSession({
      id,
      name,
      startTime,
      endTime,
      sortOrder: Number(sortOrder),
      isActive,
    });
    setEditingId(null);
    toast.success("Session updated");
  };

  const handleDelete = async (id: any) => {
    await removeSession({ id });
    toast.success("Session deleted");
  };

  const startEdit = (session: any) => {
    setEditingId(session._id);
    setName(session.name);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setSortOrder(session.sortOrder.toString());
    setIsActive(session.isActive);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Sessions</h2>
      </div>

      <p className="text-sm text-[#8494A7] mb-4">
        Split the calendar into time periods (e.g., Morning, Evening, Night) so
        you can view classes without scrolling.
      </p>

      <div className="space-y-2 mb-4">
        {sessions?.map((session) => (
          <div
            key={session._id}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            {editingId === session._id ? (
              <div className="space-y-3">
                <div>
                  <Label>Session Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Evening"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(session._id)}
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
                  <span
                    className={`font-medium ${session.isActive ? "text-[#1A2B3D]" : "text-[#A0AEC0] line-through"}`}
                  >
                    {session.name}
                  </span>
                  <span className="text-sm text-[#8494A7] ml-2">
                    {formatTime(session.startTime)} -{" "}
                    {formatTime(session.endTime)}
                  </span>
                  {!session.isActive && (
                    <span className="text-xs bg-[#EDF2F7] text-[#8494A7] px-2 py-0.5 rounded ml-2">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(session)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(session._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sessions?.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No sessions configured. Add sessions to split the calendar into
            viewable time periods.
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
          <div>
            <Label>Session Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning, Evening, Night"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="flex-1">
              Add Session
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
            setName("");
            setStartTime("");
            setEndTime("");
            setSortOrder((sessions?.length ?? 0).toString());
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Session
        </Button>
      )}
    </div>
  );
}
