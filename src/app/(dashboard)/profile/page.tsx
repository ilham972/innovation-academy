"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Phone, BookOpen, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id ? { clerkUserId: clerkUser.id } : "skip"
  );

  const teacher = useQuery(
    api.teachers.getById,
    currentUser?.teacherId
      ? { id: currentUser.teacherId as any }
      : "skip"
  );

  const subjects = useQuery(api.subjects.getActive);

  const getSubjectName = (id: string) =>
    subjects?.find((s) => s._id === id)?.name ?? "Unknown";

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[#1A2B3D] mb-6">Profile</h2>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 bg-primary/15 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1A2B3D]">
              {teacher?.name || clerkUser?.username || "User"}
            </h3>
            <Badge
              className={
                currentUser?.role === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#EDF2F7] text-[#4A5568]"
              }
            >
              <Shield className="h-3 w-3 mr-1" />
              {currentUser?.role === "admin" ? "Admin" : "Teacher"}
            </Badge>
          </div>
        </div>

        {teacher && (
          <div className="space-y-3 border-t border-[#EDF2F7] pt-4">
            {teacher.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#A0AEC0]" />
                <span className="text-sm text-[#4A5568]">{teacher.phone}</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-[#A0AEC0] mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {teacher.subjects?.length > 0 ? (
                  teacher.subjects.map((id) => (
                    <span
                      key={id}
                      className="text-xs bg-[#EDF2F7] text-[#4A5568] px-2 py-0.5 rounded"
                    >
                      {getSubjectName(id)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#A0AEC0]">
                    No subjects assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => signOut({ redirectUrl: "/" })}
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
