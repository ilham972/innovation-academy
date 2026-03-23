import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetUser = mutation({
  args: {
    clerkUserId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      isApproved: false,
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: { clerkUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.clerkUserId) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId!))
      .first();
  },
});

export const getPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_approved", (q) => q.eq("isApproved", false))
      .collect();
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const approveUser = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
    teacherId: v.optional(v.id("teachers")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isApproved: true,
      role: args.role,
      teacherId: args.teacherId,
    });

    // If teacher role and teacherId provided, link the clerkUserId to the teacher profile
    if (args.role === "teacher" && args.teacherId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.patch(args.teacherId, {
          clerkUserId: user.clerkUserId,
        });
      }
    }
  },
});

export const rejectUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});
