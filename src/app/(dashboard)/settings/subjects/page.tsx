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

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E",
  "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#EC4899", "#F43F5E", "#78716C",
];

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.getAll);
  const createSubject = useMutation(api.subjects.create);
  const updateSubject = useMutation(api.subjects.update);
  const removeSubject = useMutation(api.subjects.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]!);
  const [isActive, setIsActive] = useState(true);

  const handleAdd = async () => {
    await createSubject({ name, color });
    setShowAdd(false);
    setName("");
    setColor(PRESET_COLORS[0]!);
    toast.success("Subject added");
  };

  const handleUpdate = async (id: any) => {
    await updateSubject({ id, name, color, isActive });
    setEditingId(null);
    toast.success("Subject updated");
  };

  const handleDelete = async (id: any) => {
    try {
      await removeSubject({ id });
      toast.success("Subject deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (subject: any) => {
    setEditingId(subject._id);
    setName(subject.name);
    setColor(subject.color);
    setIsActive(subject.isActive);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Subjects</h2>
      </div>

      <div className="space-y-2 mb-4">
        {subjects?.map((subject) => (
          <div key={subject._id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {editingId === subject._id ? (
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          color === c
                            ? "border-slate-800 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(subject._id)}
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
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span
                    className={`font-medium ${subject.isActive ? "text-[#1A2B3D]" : "text-[#A0AEC0] line-through"}`}
                  >
                    {subject.name}
                  </span>
                  {!subject.isActive && (
                    <span className="text-xs bg-[#EDF2F7] text-[#8494A7] px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(subject)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(subject._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {subjects?.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No subjects added yet
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
          <div>
            <Label>Subject Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c
                      ? "border-slate-800 scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              className="flex-1"
            >
              Add Subject
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
            setColor(PRESET_COLORS[0]!);
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Subject
        </Button>
      )}
    </div>
  );
}
