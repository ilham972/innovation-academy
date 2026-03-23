import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.filter((s) => s.isActive);
  },
});

export const create = mutation({
  args: { name: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", {
      name: args.name,
      color: args.color,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.string(),
    color: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    // Check if any timetable entries reference this subject
    const entries = await ctx.db.query("timetableEntries").collect();
    const used = entries.filter((e) => e.subjectId === args.id);
    if (used.length > 0) {
      throw new Error(
        `Cannot delete: This subject has ${used.length} class(es) assigned. Remove them first.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
