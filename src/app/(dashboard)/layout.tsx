"use client";

import { Show, useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id ? { clerkUserId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (currentUser && !currentUser.isApproved) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (isLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.isApproved) {
    return null;
  }

  const role = (currentUser.role as "admin" | "teacher") ?? "teacher";

  return (
    <Show when="signed-in">
      <div className="min-h-screen pb-20 bg-[#F5F7FA]">
        <main className="max-w-lg mx-auto">{children}</main>
        <BottomNav
          role={role}
          teacherId={currentUser.teacherId ?? undefined}
        />
      </div>
    </Show>
  );
}
