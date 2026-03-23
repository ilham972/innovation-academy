import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const grades = await ctx.db.query("grades").collect();
    return grades.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const grades = await ctx.db.query("grades").collect();
    return grades
      .filter((g) => g.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: { name: v.string(), sortOrder: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("grades", {
      name: args.name,
      sortOrder: args.sortOrder,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("grades"),
    name: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("grades") },
  handler: async (ctx, args) => {
    // Check if any timetable entries reference this grade
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.id))
      .collect();
    if (entries.length > 0) {
      throw new Error(
        `Cannot delete: This grade has ${entries.length} class(es) assigned. Remove them first.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
