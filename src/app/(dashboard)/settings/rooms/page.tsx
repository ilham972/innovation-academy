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

export default function RoomsPage() {
  const rooms = useQuery(api.rooms.getAll);
  const createRoom = useMutation(api.rooms.create);
  const updateRoom = useMutation(api.rooms.update);
  const removeRoom = useMutation(api.rooms.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const handleAdd = async () => {
    await createRoom({
      name,
      capacity: capacity ? Number(capacity) : undefined,
    });
    setShowAdd(false);
    setName("");
    setCapacity("");
    toast.success("Room added");
  };

  const handleUpdate = async (id: any) => {
    await updateRoom({
      id,
      name,
      capacity: capacity ? Number(capacity) : undefined,
      isActive,
    });
    setEditingId(null);
    toast.success("Room updated");
  };

  const handleDelete = async (id: any) => {
    try {
      await removeRoom({ id });
      toast.success("Room deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (room: any) => {
    setEditingId(room._id);
    setName(room.name);
    setCapacity(room.capacity?.toString() || "");
    setIsActive(room.isActive);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Rooms</h2>
      </div>

      <div className="space-y-2 mb-4">
        {rooms?.map((room) => (
          <div key={room._id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {editingId === room._id ? (
              <div className="space-y-3">
                <div>
                  <Label>Room Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Capacity (optional)</Label>
                  <Input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Max students"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(room._id)}
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
                  <span
                    className={`font-medium ${room.isActive ? "text-[#1A2B3D]" : "text-[#A0AEC0] line-through"}`}
                  >
                    {room.name}
                  </span>
                  {room.capacity && (
                    <span className="text-sm text-[#8494A7] ml-2">
                      (Cap: {room.capacity})
                    </span>
                  )}
                  {!room.isActive && (
                    <span className="text-xs bg-[#EDF2F7] text-[#8494A7] px-2 py-0.5 rounded ml-2">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(room)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(room._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {rooms?.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No rooms added yet
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
          <div>
            <Label>Room Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Room A, Main Hall"
            />
          </div>
          <div>
            <Label>Capacity (optional)</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Max students"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              className="flex-1"
            >
              Add Room
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
            setCapacity("");
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Room
        </Button>
      )}
    </div>
  );
}
