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

export default function TeachersPage() {
  const teachers = useQuery(api.teachers.getAll);
  const subjects = useQuery(api.subjects.getActive);
  const createTeacher = useMutation(api.teachers.create);
  const updateTeacher = useMutation(api.teachers.update);
  const removeTeacher = useMutation(api.teachers.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [canViewFull, setCanViewFull] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleAdd = async () => {
    await createTeacher({
      name,
      phone: phone || undefined,
      subjects: selectedSubjects as any,
      canViewFullTimetable: canViewFull,
    });
    setShowAdd(false);
    resetForm();
    toast.success("Teacher added");
  };

  const handleUpdate = async (id: any) => {
    await updateTeacher({
      id,
      name,
      phone: phone || undefined,
      subjects: selectedSubjects as any,
      canViewFullTimetable: canViewFull,
      isActive,
    });
    setEditingId(null);
    toast.success("Teacher updated");
  };

  const handleDelete = async (id: any) => {
    try {
      await removeTeacher({ id });
      toast.success("Teacher deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setSelectedSubjects([]);
    setCanViewFull(false);
    setIsActive(true);
  };

  const startEdit = (teacher: any) => {
    setEditingId(teacher._id);
    setName(teacher.name);
    setPhone(teacher.phone || "");
    setSelectedSubjects(teacher.subjects || []);
    setCanViewFull(teacher.canViewFullTimetable);
    setIsActive(teacher.isActive);
  };

  const getSubjectName = (id: string) => {
    return subjects?.find((s) => s._id === id)?.name ?? "Unknown";
  };

  const TeacherForm = ({ onSave, saveLabel }: { onSave: () => void; saveLabel: string }) => (
    <div className="space-y-3">
      <div>
        <Label>Full Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
      <div>
        <Label>Phone (optional)</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
      </div>
      <div>
        <Label>Subjects</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {subjects?.map((subject) => (
            <button
              key={subject._id}
              onClick={() => toggleSubject(subject._id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedSubjects.includes(subject._id)
                  ? "text-white border-transparent"
                  : "text-[#4A5568] border-[#E2E8F0] bg-white"
              }`}
              style={
                selectedSubjects.includes(subject._id)
                  ? { backgroundColor: subject.color }
                  : {}
              }
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={canViewFull} onCheckedChange={setCanViewFull} />
        <Label>Allow full timetable view</Label>
      </div>
      {editingId && (
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label>Active</Label>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} className="flex-1">
          <Check className="h-4 w-4 mr-1" /> {saveLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingId(null);
            setShowAdd(false);
          }}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Teachers</h2>
      </div>

      <div className="space-y-2 mb-4">
        {teachers?.map((teacher) => (
          <div key={teacher._id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {editingId === teacher._id ? (
              <TeacherForm
                onSave={() => handleUpdate(teacher._id)}
                saveLabel="Save"
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`font-medium ${teacher.isActive ? "text-[#1A2B3D]" : "text-[#A0AEC0] line-through"}`}
                  >
                    {teacher.name}
                  </div>
                  <div className="text-sm text-[#8494A7]">
                    {teacher.subjects?.map((id) => getSubjectName(id)).join(", ") || "No subjects"}
                  </div>
                  {teacher.canViewFullTimetable && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                      Full timetable access
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(teacher)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(teacher._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {teachers?.length === 0 && (
          <div className="text-center py-8 text-[#A0AEC0]">
            No teachers added yet
          </div>
        )}
      </div>

      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <TeacherForm onSave={handleAdd} saveLabel="Add Teacher" />
        </div>
      ) : (
        <Button
          onClick={() => {
            setShowAdd(true);
            resetForm();
          }}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Teacher
        </Button>
      )}
    </div>
  );
}
