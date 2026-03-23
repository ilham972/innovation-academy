"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  Send,
  Loader2,
  XCircle,
  Users,
  CalendarClock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function NotificationsPage() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    clerkUser?.id ? { clerkUserId: clerkUser.id } : "skip"
  );

  const isAdmin = currentUser?.role === "admin";
  const teacherId = currentUser?.teacherId;

  const teacherNotifications = useQuery(
    api.notifications.getForTeacher,
    teacherId ? { teacherId: teacherId as any } : "skip"
  );

  const allNotifications = useQuery(
    api.notifications.getAllRecent,
    isAdmin ? {} : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const sendAnnouncement = useMutation(api.notifications.sendAnnouncement);

  const teachers = useQuery(
    api.teachers.getActive,
    isAdmin ? {} : "skip"
  );

  const [showSendForm, setShowSendForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [recipientId, setRecipientId] = useState("");

  const notifications = isAdmin
    ? allNotifications
    : teacherNotifications;

  const handleMarkRead = async (id: any) => {
    await markAsRead({ id });
  };

  const handleMarkAllRead = async () => {
    if (teacherId) {
      await markAllAsRead({ teacherId: teacherId as any });
      toast.success("All marked as read");
    }
  };

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Please fill title and message");
      return;
    }
    await sendAnnouncement({
      title,
      message,
      sendToAll,
      recipientTeacherId: !sendToAll ? (recipientId as any) : undefined,
    });
    toast.success("Announcement sent");
    setShowSendForm(false);
    setTitle("");
    setMessage("");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cancellation":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "substitution":
        return <Users className="h-4 w-4 text-amber-500" />;
      case "schedule_change":
        return <CalendarClock className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-[#A0AEC0]" />;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1A2B3D]">Notifications</h2>
        <div className="flex gap-2">
          {!isAdmin && teacherId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" /> Read All
            </Button>
          )}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowSendForm(!showSendForm)}
              className=""
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          )}
        </div>
      </div>

      {/* Send announcement form */}
      {showSendForm && isAdmin && (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-primary/20 mb-4">
          <h3 className="font-bold text-[#1A2B3D] mb-3">
            Send Announcement
          </h3>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <div>
              <Label>Recipients</Label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setSendToAll(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    sendToAll
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-[#E2E8F0] text-[#4A5568]"
                  }`}
                >
                  All Teachers
                </button>
                <button
                  onClick={() => setSendToAll(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    !sendToAll
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-[#E2E8F0] text-[#4A5568]"
                  }`}
                >
                  Specific
                </button>
              </div>
            </div>
            {!sendToAll && (
              <div>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select teacher...</option>
                  {teachers?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                className="flex-1"
              >
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSendForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {notifications === undefined ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-[#A0AEC0]">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <button
              key={notif._id}
              onClick={() => {
                if (!notif.isRead) handleMarkRead(notif._id);
              }}
              className={`w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors ${
                !notif.isRead ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium text-sm ${!notif.isRead ? "text-[#1A2B3D]" : "text-[#4A5568]"}`}
                    >
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <Badge className="bg-primary text-white text-[10px] px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#8494A7] mt-0.5">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#A0AEC0]">
                      {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                    </span>
                    {notif.relatedDate && (
                      <span className="text-xs text-[#A0AEC0]">
                        &middot; For: {notif.relatedDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
