import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("operatingDays").collect();
  },
});

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("operatingDays").collect();
    if (existing.length > 0) return;

    // Initialize all 7 days, with Mon-Fri active by default
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (let i = 0; i < 7; i++) {
      void dayNames[i]; // for clarity
      await ctx.db.insert("operatingDays", {
        dayOfWeek: i,
        isActive: i >= 1 && i <= 5, // Mon-Fri
      });
    }
  },
});

export const toggle = mutation({
  args: {
    id: v.id("operatingDays"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});
