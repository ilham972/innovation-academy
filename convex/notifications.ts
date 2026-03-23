import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getForTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_teacher", (q) =>
        q.eq("recipientTeacherId", args.teacherId)
      )
      .collect();
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUnreadCount = query({
  args: { teacherId: v.optional(v.id("teachers")) },
  handler: async (ctx, args) => {
    if (!args.teacherId) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_teacher_unread", (q) =>
        q.eq("recipientTeacherId", args.teacherId!).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_teacher_unread", (q) =>
        q.eq("recipientTeacherId", args.teacherId).eq("isRead", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const sendAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    recipientTeacherId: v.optional(v.id("teachers")),
    sendToAll: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.sendToAll) {
      const teachers = await ctx.db.query("teachers").collect();
      const activeTeachers = teachers.filter((t) => t.isActive);
      for (const teacher of activeTeachers) {
        await ctx.db.insert("notifications", {
          recipientTeacherId: teacher._id,
          title: args.title,
          message: args.message,
          type: "general",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    } else if (args.recipientTeacherId) {
      await ctx.db.insert("notifications", {
        recipientTeacherId: args.recipientTeacherId,
        title: args.title,
        message: args.message,
        type: "general",
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const getAllRecent = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("notifications").collect();
    return notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  },
});
