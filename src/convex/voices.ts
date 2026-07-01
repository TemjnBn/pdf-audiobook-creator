import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("voices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const saveVoice = mutation({
  args: {
    provider: v.union(
      v.literal("elevenlabs"),
      v.literal("google_cloud"),
      v.literal("openai"),
    ),
    voiceId: v.string(),
    name: v.string(),
    language: v.string(),
    accent: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("non_binary"))),
    tags: v.optional(v.array(v.string())),
    previewUrl: v.optional(v.string()),
    isCloned: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    apiMetadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) throw new Error("User not found");

    // Check if voice already exists
    const existing = await ctx.db
      .query("voices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), args.provider),
          q.eq(q.field("voiceId"), args.voiceId),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("voices", {
      userId: user._id,
      ...args,
    });
  },
});

export const removeVoice = mutation({
  args: { voiceId: v.id("voices") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.voiceId);
  },
});
