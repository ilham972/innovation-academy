"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CenterSettingsPage() {
  const settings = useQuery(api.centerSettings.get);
  const updateSettings = useMutation(api.centerSettings.update);

  const [centerName, setCenterName] = useState("");
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(60);

  useEffect(() => {
    if (settings) {
      setCenterName(settings.centerName);
      setDefaultSlotDuration(settings.defaultSlotDuration);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({ centerName, defaultSlotDuration });
    toast.success("Settings saved");
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings" className="p-1">
          <ArrowLeft className="h-5 w-5 text-[#4A5568]" />
        </Link>
        <h2 className="text-xl font-bold text-[#1A2B3D]">Center Settings</h2>
      </div>

      <div className="space-y-4 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div>
          <Label htmlFor="centerName">Center Name</Label>
          <Input
            id="centerName"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder="e.g., Innovation Academy"
          />
        </div>
        <div>
          <Label htmlFor="duration">Default Slot Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={defaultSlotDuration}
            onChange={(e) => setDefaultSlotDuration(Number(e.target.value))}
            min={15}
            max={180}
          />
        </div>
        <Button
          onClick={handleSave}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
