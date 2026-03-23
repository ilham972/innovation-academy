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

export default function GradesPage() {
  const grades = useQuery(api.grades.getAll);
  const createGrade = useMutation(api.grades.create);
  const updateGrade = useMutation(api.grades.update);
  const removeGrade = useMutation(api.grades.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const handleAdd = async () => {
    const nextOrder = grades ? grades.length + 1 : 1;
    await createGrade({ name, sortOrder: sortOrder || nextOrder });
    setShowAdd(false);
    setName("");
    setSortOrder(0);
    toast.success("Grade added");
  };

  const handleUpdate = async (id: any) => {
    await updateGrade({ id, name, sortOrder, isActive });
    setEditingId(null);
    toast.success("Grade updated");
  };

  const handleDelete = async (id: any) => {
    try {
      await removeGrade({ id });
      toast.success("Grade deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (grade: any) => {
    setEditingId(grade._id);
    setName(grade.name);
    setSortOrder(grade.sortOrder);
    setIsActive(grade.isActive);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Grades</h2>
      </div>

      <div className="space-y-2 mb-4">
        {grades?.map((grade) => (
          <div key={grade._id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {editingId === grade._id ? (
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
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
                    onClick={() => handleUpdate(grade._id)}
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
                  <span
                    className={`font-medium ${grade.isActive ? "text-[#1A2B3D]" : "text-[#A0AEC0] line-through"}`}
                  >
                    {grade.name}
                  </span>
                  {!grade.isActive && (
                    <span className="text-xs bg-[#EDF2F7] text-[#8494A7] px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(grade)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(grade._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {grades?.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No grades added yet
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3">
          <div>
            <Label>Grade Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grade 6, Primary 1"
            />
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sortOrder || (grades ? grades.length + 1 : 1)}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              className="flex-1"
            >
              Add Grade
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
            setSortOrder(grades ? grades.length + 1 : 1);
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Grade
        </Button>
      )}
    </div>
  );
}
