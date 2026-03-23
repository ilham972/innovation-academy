import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const teachers = await ctx.db.query("teachers").collect();
    return teachers.filter((t) => t.isActive);
  },
});

export const getById = query({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByClerkUserId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const teachers = await ctx.db.query("teachers").collect();
    return teachers.find((t) => t.clerkUserId === args.clerkUserId) ?? null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    subjects: v.array(v.id("subjects")),
    canViewFullTimetable: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", {
      name: args.name,
      phone: args.phone,
      subjects: args.subjects,
      canViewFullTimetable: args.canViewFullTimetable,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teachers"),
    name: v.string(),
    phone: v.optional(v.string()),
    subjects: v.array(v.id("subjects")),
    canViewFullTimetable: v.boolean(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      phone: args.phone,
      subjects: args.subjects,
      canViewFullTimetable: args.canViewFullTimetable,
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.id))
      .collect();
    if (entries.length > 0) {
      throw new Error(
        `Cannot delete: This teacher has ${entries.length} class(es) assigned. Remove or reassign them first.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
