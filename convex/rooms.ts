import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").collect();
    return rooms.filter((r) => r.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", {
      name: args.name,
      capacity: args.capacity,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("rooms"),
    name: v.string(),
    capacity: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      capacity: args.capacity,
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_room", (q) => q.eq("roomId", args.id))
      .collect();
    if (entries.length > 0) {
      throw new Error(
        `Cannot delete: This room has ${entries.length} class(es) assigned. Remove them first.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
