"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DAY_NAMES } from "@/lib/days";
import { useEffect } from "react";
import { toast } from "sonner";

export default function OperatingDaysPage() {
  const days = useQuery(api.operatingDays.getAll);
  const initialize = useMutation(api.operatingDays.initialize);
  const toggle = useMutation(api.operatingDays.toggle);

  useEffect(() => {
    if (days && days.length === 0) {
      initialize();
    }
  }, [days, initialize]);

  const sortedDays = days
    ? [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];

  const handleToggle = async (id: any, isActive: boolean) => {
    await toggle({ id, isActive });
    toast.success("Updated");
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Operating Days</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] divide-y divide-[#EDF2F7]">
        {sortedDays.map((day) => (
          <div
            key={day._id}
            className="flex items-center justify-between p-4"
          >
            <span className="font-medium text-[#1A2B3D]">
              {DAY_NAMES[day.dayOfWeek]}
            </span>
            <Switch
              checked={day.isActive}
              onCheckedChange={(checked) => handleToggle(day._id, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
