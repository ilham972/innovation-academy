import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const overrides = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const populated = await Promise.all(
      overrides.map(async (override) => {
        const entry = await ctx.db.get(override.timetableEntryId);
        let substituteTeacher = null;
        if (override.substituteTeacherId) {
          substituteTeacher = await ctx.db.get(override.substituteTeacherId);
        }
        let grade = null,
          subject = null,
          teacher = null,
          room = null,
          timeSlot = null;
        if (entry) {
          [grade, subject, teacher, room, timeSlot] = await Promise.all([
            ctx.db.get(entry.gradeId),
            ctx.db.get(entry.subjectId),
            ctx.db.get(entry.teacherId),
            ctx.db.get(entry.roomId),
            ctx.db.get(entry.timeSlotId),
          ]);
        }
        return {
          ...override,
          entry,
          grade,
          subject,
          teacher,
          room,
          timeSlot,
          substituteTeacher,
        };
      })
    );

    return populated;
  },
});

export const getByEntryAndDate = query({
  args: {
    timetableEntryId: v.id("timetableEntries"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const overrides = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_entry", (q) =>
        q.eq("timetableEntryId", args.timetableEntryId)
      )
      .collect();
    return overrides.find((o) => o.date === args.date) ?? null;
  },
});

export const cancelClass = mutation({
  args: {
    timetableEntryId: v.id("timetableEntries"),
    date: v.string(),
    reason: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for existing override
    const existing = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_entry", (q) =>
        q.eq("timetableEntryId", args.timetableEntryId)
      )
      .collect();
    const existingForDate = existing.find((o) => o.date === args.date);
    if (existingForDate) {
      await ctx.db.patch(existingForDate._id, {
        type: "cancelled",
        substituteTeacherId: undefined,
        reason: args.reason,
      });
    } else {
      await ctx.db.insert("scheduleOverrides", {
        timetableEntryId: args.timetableEntryId,
        date: args.date,
        type: "cancelled",
        reason: args.reason,
        createdBy: args.createdBy,
        createdAt: Date.now(),
      });
    }

    // Create notification for the teacher
    const entry = await ctx.db.get(args.timetableEntryId);
    if (entry) {
      const grade = await ctx.db.get(entry.gradeId);
      const subject = await ctx.db.get(entry.subjectId);
      await ctx.db.insert("notifications", {
        recipientTeacherId: entry.teacherId,
        title: "Class Cancelled",
        message: `Your ${grade?.name} ${subject?.name} class on ${args.date} has been cancelled.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        type: "cancellation",
        isRead: false,
        relatedDate: args.date,
        createdAt: Date.now(),
      });
    }
  },
});

export const assignSubstitute = mutation({
  args: {
    timetableEntryId: v.id("timetableEntries"),
    date: v.string(),
    substituteTeacherId: v.id("teachers"),
    reason: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for existing override
    const existing = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_entry", (q) =>
        q.eq("timetableEntryId", args.timetableEntryId)
      )
      .collect();
    const existingForDate = existing.find((o) => o.date === args.date);
    if (existingForDate) {
      await ctx.db.patch(existingForDate._id, {
        type: "substitution",
        substituteTeacherId: args.substituteTeacherId,
        reason: args.reason,
      });
    } else {
      await ctx.db.insert("scheduleOverrides", {
        timetableEntryId: args.timetableEntryId,
        date: args.date,
        type: "substitution",
        substituteTeacherId: args.substituteTeacherId,
        reason: args.reason,
        createdBy: args.createdBy,
        createdAt: Date.now(),
      });
    }

    // Get entry details for notification messages
    const entry = await ctx.db.get(args.timetableEntryId);
    if (entry) {
      const [grade, subject, room, substituteTeacher] = await Promise.all([
        ctx.db.get(entry.gradeId),
        ctx.db.get(entry.subjectId),
        ctx.db.get(entry.roomId),
        ctx.db.get(args.substituteTeacherId),
      ]);

      // Notify original teacher
      await ctx.db.insert("notifications", {
        recipientTeacherId: entry.teacherId,
        title: "Substitute Assigned",
        message: `Your ${grade?.name} ${subject?.name} class on ${args.date} has been assigned to ${substituteTeacher?.name}.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        type: "substitution",
        isRead: false,
        relatedDate: args.date,
        createdAt: Date.now(),
      });

      // Notify substitute teacher
      await ctx.db.insert("notifications", {
        recipientTeacherId: args.substituteTeacherId,
        title: "Covering Class",
        message: `You have been assigned to cover ${grade?.name} ${subject?.name} on ${args.date} in ${room?.name}.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        type: "substitution",
        isRead: false,
        relatedDate: args.date,
        createdAt: Date.now(),
      });
    }
  },
});

export const removeOverride = mutation({
  args: { id: v.id("scheduleOverrides") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
