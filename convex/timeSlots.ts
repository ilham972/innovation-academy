import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByDay = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.dayOfWeek))
      .collect();
    return slots.sort((a, b) => a.slotIndex - b.slotIndex);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("timeSlots").collect();
  },
});

export const create = mutation({
  args: {
    dayOfWeek: v.number(),
    slotIndex: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("timeSlots", {
      dayOfWeek: args.dayOfWeek,
      slotIndex: args.slotIndex,
      startTime: args.startTime,
      endTime: args.endTime,
      label: args.label,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("timeSlots"),
    startTime: v.string(),
    endTime: v.string(),
    label: v.optional(v.string()),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      startTime: args.startTime,
      endTime: args.endTime,
      label: args.label,
      slotIndex: args.slotIndex,
    });
  },
});

export const copyToOtherDays = mutation({
  args: {
    fromDayOfWeek: v.number(),
    toDays: v.array(v.number()),
    replaceExisting: v.boolean(),
  },
  handler: async (ctx, args) => {
    const sourceSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", args.fromDayOfWeek))
      .collect();

    for (const targetDay of args.toDays) {
      if (args.replaceExisting) {
        const existing = await ctx.db
          .query("timeSlots")
          .withIndex("by_day", (q) => q.eq("dayOfWeek", targetDay))
          .collect();
        for (const slot of existing) {
          // Skip if slot has timetable entries
          const entries = await ctx.db
            .query("timetableEntries")
            .collect();
          const used = entries.filter((e) => e.timeSlotId === slot._id);
          if (used.length === 0) {
            await ctx.db.delete(slot._id);
          }
        }
      }

      const existingCount = (await ctx.db
        .query("timeSlots")
        .withIndex("by_day", (q) => q.eq("dayOfWeek", targetDay))
        .collect()).length;

      for (let i = 0; i < sourceSlots.length; i++) {
        const src = sourceSlots[i]!;
        await ctx.db.insert("timeSlots", {
          dayOfWeek: targetDay,
          slotIndex: existingCount + i + 1,
          startTime: src.startTime,
          endTime: src.endTime,
          label: src.label,
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("timeSlots") },
  handler: async (ctx, args) => {
    // Check if any timetable entries use this slot
    const entries = await ctx.db.query("timetableEntries").collect();
    const used = entries.filter((e) => e.timeSlotId === args.id);
    if (used.length > 0) {
      throw new Error(
        `Cannot delete: This time slot has ${used.length} class(es) assigned. Remove them first.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
