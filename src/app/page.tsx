"use client";

import { Show, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const createOrGetUser = useMutation(api.auth.createOrGetUser);
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id ? { clerkUserId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (isAuthenticated && clerkUser?.id) {
      createOrGetUser({
        clerkUserId: clerkUser.id,
        username: clerkUser.username ?? clerkUser.firstName ?? undefined,
      });
    }
  }, [isAuthenticated, clerkUser?.id, clerkUser?.username, clerkUser?.firstName, createOrGetUser]);

  useEffect(() => {
    if (currentUser?.isApproved) {
      if (currentUser.role === "admin") {
        router.replace("/timetable");
      } else {
        router.replace("/schedule");
      }
    }
  }, [currentUser, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F7FA]">
      <Show when="signed-out">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">IA</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A2B3D]">
            Innovation Academy
          </h1>
          <p className="text-[#8494A7]">
            Tuition Center Timetable Management
          </p>
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" className="w-full">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </Show>

      <Show when="signed-in">
        {!currentUser ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-[#8494A7]">Loading...</p>
          </div>
        ) : !currentUser.isApproved ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-amber-600 text-2xl">&#x23F3;</span>
            </div>
            <h2 className="text-xl font-bold text-[#1A2B3D]">
              Pending Approval
            </h2>
            <p className="text-[#8494A7]">
              Your account is pending approval from an administrator. You&apos;ll
              be able to access the app once approved.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-[#8494A7]">Redirecting...</p>
          </div>
        )}
      </Show>
    </div>
  );
}
