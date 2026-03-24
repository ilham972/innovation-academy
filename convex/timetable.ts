import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByDay = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .collect();

    // Populate references
    const populated = await Promise.all(
      entries.map(async (entry) => {
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);
        return {
          ...entry,
          grade,
          subject,
          teacher,
          room,
          timeSlot,
        };
      })
    );

    return populated;
  },
});

export const getByTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const populated = await Promise.all(
      entries.map(async (entry) => {
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);
        return { ...entry, grade, subject, teacher, room, timeSlot };
      })
    );

    return populated;
  },
});

export const getByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const populated = await Promise.all(
      entries.map(async (entry) => {
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);
        return { ...entry, grade, subject, teacher, room, timeSlot };
      })
    );

    return populated;
  },
});

export const getByGrade = query({
  args: { gradeId: v.id("grades") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .collect();

    const populated = await Promise.all(
      entries.map(async (entry) => {
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);
        return { ...entry, grade, subject, teacher, room, timeSlot };
      })
    );

    return populated;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("timetableEntries").collect();

    const populated = await Promise.all(
      entries.map(async (entry) => {
        const [grade, subject, teacher, room, timeSlot] = await Promise.all([
          ctx.db.get(entry.gradeId),
          ctx.db.get(entry.subjectId),
          ctx.db.get(entry.teacherId),
          ctx.db.get(entry.roomId),
          ctx.db.get(entry.timeSlotId),
        ]);
        return { ...entry, grade, subject, teacher, room, timeSlot };
      })
    );

    return populated;
  },
});

export const checkConflicts = query({
  args: {
    dayOfWeek: v.number(),
    timeSlotId: v.id("timeSlots"),
    teacherId: v.id("teachers"),
    roomId: v.id("rooms"),
    excludeEntryId: v.optional(v.id("timetableEntries")),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .collect();

    const sameSlot = entries.filter(
      (e) =>
        e.timeSlotId === args.timeSlotId &&
        (!args.excludeEntryId || e._id !== args.excludeEntryId)
    );

    const warnings: string[] = [];

    // Check teacher conflicts
    const teacherConflicts = sameSlot.filter(
      (e) => e.teacherId === args.teacherId
    );
    if (teacherConflicts.length > 0) {
      const teacher = await ctx.db.get(args.teacherId);
      const rooms = await Promise.all(
        teacherConflicts.map((e) => ctx.db.get(e.roomId))
      );
      const roomNames = rooms.map((r) => r?.name ?? "Unknown").join(", ");
      warnings.push(
        `${teacher?.name} is already assigned to ${roomNames} at this time`
      );
    }

    // Check room conflicts
    const roomConflicts = sameSlot.filter((e) => e.roomId === args.roomId);
    if (roomConflicts.length > 0) {
      const room = await ctx.db.get(args.roomId);
      const grades = await Promise.all(
        roomConflicts.map((e) => ctx.db.get(e.gradeId))
      );
      const subjects = await Promise.all(
        roomConflicts.map((e) => ctx.db.get(e.subjectId))
      );
      const details = roomConflicts
        .map((_, i) => `${grades[i]?.name} ${subjects[i]?.name}`)
        .join(", ");
      warnings.push(`${room?.name} already has ${details} at this time`);
    }

    return warnings;
  },
});

export const create = mutation({
  args: {
    dayOfWeek: v.number(),
    timeSlotId: v.id("timeSlots"),
    gradeId: v.id("grades"),
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    roomId: v.id("rooms"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("timetableEntries", {
      dayOfWeek: args.dayOfWeek,
      timeSlotId: args.timeSlotId,
      gradeId: args.gradeId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      roomId: args.roomId,
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("timetableEntries"),
    gradeId: v.id("grades"),
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    roomId: v.id("rooms"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      gradeId: args.gradeId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      roomId: args.roomId,
      notes: args.notes,
    });
  },
});

export const reschedule = mutation({
  args: {
    id: v.id("timetableEntries"),
    dayOfWeek: v.number(),
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      dayOfWeek: args.dayOfWeek,
      timeSlotId: args.timeSlotId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("timetableEntries") },
  handler: async (ctx, args) => {
    // Also delete related overrides
    const overrides = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_entry", (q) => q.eq("timetableEntryId", args.id))
      .collect();
    for (const override of overrides) {
      await ctx.db.delete(override._id);
    }
    await ctx.db.delete(args.id);
  },
});
