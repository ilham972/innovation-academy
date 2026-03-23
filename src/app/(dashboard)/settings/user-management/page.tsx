"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Shield, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function UserManagementPage() {
  const pendingUsers = useQuery(api.auth.getPendingUsers);
  const allUsers = useQuery(api.auth.getAllUsers);
  const teachers = useQuery(api.teachers.getActive);
  const approveUser = useMutation(api.auth.approveUser);
  const rejectUser = useMutation(api.auth.rejectUser);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "teacher">("teacher");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const handleApprove = async (userId: any) => {
    if (role === "teacher" && !selectedTeacherId) {
      toast.error("Please link a teacher profile");
      return;
    }
    await approveUser({
      userId,
      role,
      teacherId: role === "teacher" ? (selectedTeacherId as any) : undefined,
    });
    setApprovingId(null);
    toast.success("User approved");
  };

  const handleReject = async (userId: any) => {
    await rejectUser({ userId });
    toast.success("User rejected");
  };

  const approvedUsers = allUsers?.filter((u) => u.isApproved) ?? [];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">User Management</h2>
      </div>

      {/* Pending users */}
      <h3 className="font-bold text-[#2D3748] mb-2">Pending Approval</h3>
      <div className="space-y-2 mb-6">
        {pendingUsers?.map((user) => (
          <div key={user._id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium text-[#1A2B3D]">
                  {user.username || "Unknown User"}
                </div>
                <div className="text-xs text-[#A0AEC0]">
                  ID: {user.clerkUserId.slice(0, 12)}...
                </div>
              </div>
              {approvingId !== user._id && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovingId(user._id);
                      setRole("teacher");
                      setSelectedTeacherId("");
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(user._id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {approvingId === user._id && (
              <div className="border-t border-[#EDF2F7] pt-3 space-y-3">
                <div>
                  <Label>Assign Role</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setRole("teacher")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border ${
                        role === "teacher"
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-[#E2E8F0] text-[#4A5568]"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" /> Teacher
                    </button>
                    <button
                      onClick={() => setRole("admin")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border ${
                        role === "admin"
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-[#E2E8F0] text-[#4A5568]"
                      }`}
                    >
                      <Shield className="h-4 w-4" /> Admin
                    </button>
                  </div>
                </div>

                {role === "teacher" && (
                  <div>
                    <Label>Link to Teacher Profile</Label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white mt-1"
                    >
                      <option value="">Select teacher profile...</option>
                      {teachers?.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[#A0AEC0] mt-1">
                      Create teacher profiles in Settings → Teachers first
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(user._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setApprovingId(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {pendingUsers?.length === 0 && (
          <div className="text-center py-6 text-[#A0AEC0] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            No pending signups
          </div>
        )}
      </div>

      {/* Approved users */}
      <h3 className="font-bold text-[#2D3748] mb-2">Approved Users</h3>
      <div className="space-y-2">
        {approvedUsers.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-[#1A2B3D]">
                {user.username || "Unknown"}
              </div>
              <div className="text-xs text-[#A0AEC0]">
                {user.clerkUserId.slice(0, 12)}...
              </div>
            </div>
            <Badge
              variant={user.role === "admin" ? "default" : "secondary"}
              className={
                user.role === "admin"
                  ? "bg-primary"
                  : "bg-[#EDF2F7] text-[#4A5568]"
              }
            >
              {user.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
