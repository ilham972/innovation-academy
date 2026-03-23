import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("centerSettings").first();
    return (
      settings ?? {
        centerName: "Tuition Center",
        defaultSlotDuration: 60,
      }
    );
  },
});

export const update = mutation({
  args: {
    centerName: v.string(),
    defaultSlotDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("centerSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        centerName: args.centerName,
        defaultSlotDuration: args.defaultSlotDuration,
      });
    } else {
      await ctx.db.insert("centerSettings", {
        centerName: args.centerName,
        defaultSlotDuration: args.defaultSlotDuration,
      });
    }
  },
});
