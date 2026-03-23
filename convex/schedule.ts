import { v } from "convex/values";
import { query } from "./_generated/server";

// Get teacher schedule for a specific date, with overrides merged
export const getTeacherScheduleForDate = query({
  args: {
    teacherId: v.id("teachers"),
    date: v.string(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all entries for this teacher on the given day of week
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const dayEntries = entries.filter(
      (e) => e.dayOfWeek === args.dayOfWeek
    );

    // Get overrides for this date
    const overrides = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    // Also get entries where this teacher is a substitute
    const allOverridesForDate = overrides;
    const substituteOverrides = allOverridesForDate.filter(
      (o) =>
        o.substituteTeacherId === args.teacherId && o.type === "substitution"
    );

    // Populate day entries with override info
    const populatedEntries = await Promise.all(
      dayEntries.map(async (entry) => {
        const override = overrides.find(
          (o) => o.timetableEntryId === entry._id
        );
        const [grade, subject, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);

        let substituteTeacher = null;
        if (override?.substituteTeacherId) {
          substituteTeacher = await ctx.db.get(override.substituteTeacherId);
        }

        return {
          ...entry,
          grade,
          subject,
          room,
          timeSlot,
          override: override
            ? {
                type: override.type,
                reason: override.reason,
                substituteTeacher,
              }
            : null,
        };
      })
    );

    // Populate substitute entries (classes this teacher is covering)
    const substituteEntries = await Promise.all(
      substituteOverrides.map(async (override) => {
        const entry = await ctx.db.get(override.timetableEntryId);
        if (!entry || entry.dayOfWeek !== args.dayOfWeek) return null;

        const [grade, subject, room, timeSlot, originalTeacher] =
          await Promise.all([
            ctx.db.get(entry.gradeId),
            ctx.db.get(entry.subjectId),
            ctx.db.get(entry.roomId),
            ctx.db.get(entry.timeSlotId),
            ctx.db.get(entry.teacherId),
          ]);

        return {
          ...entry,
          grade,
          subject,
          room,
          timeSlot,
          isCovering: true,
          originalTeacher,
          override: {
            type: "substitution" as const,
            reason: override.reason,
            substituteTeacher: null,
          },
        };
      })
    );

    const allEntries = [
      ...populatedEntries,
      ...substituteEntries.filter(Boolean),
    ];

    // Sort by time slot start time
    return allEntries.sort((a, b) => {
      const aTime = a?.timeSlot?.startTime ?? "";
      const bTime = b?.timeSlot?.startTime ?? "";
      return aTime.localeCompare(bTime);
    });
  },
});

// Get all classes for a specific date (for admin overrides view)
export const getClassesForDate = query({
  args: {
    date: v.string(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .collect();

    const overrides = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const populated = await Promise.all(
      entries.map(async (entry) => {
        const override = overrides.find(
          (o) => o.timetableEntryId === entry._id
        );
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);

        let substituteTeacher = null;
        if (override?.substituteTeacherId) {
          substituteTeacher = await ctx.db.get(override.substituteTeacherId);
        }

        return {
          ...entry,
          grade,
          subject,
          teacher,
          room,
          timeSlot,
          override: override
            ? {
                _id: override._id,
                type: override.type,
                reason: override.reason,
                substituteTeacher,
              }
            : null,
        };
      })
    );

    return populated.sort((a, b) => {
      const aTime = a.timeSlot?.startTime ?? "";
      const bTime = b.timeSlot?.startTime ?? "";
      return aTime.localeCompare(bTime);
    });
  },
});
