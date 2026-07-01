import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user_book", (q) =>
        q.eq("userId", user._id).eq("bookId", args.bookId),
      )
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    chapterNumber: v.number(),
    position: v.number(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("bookmarks", {
      userId: user._id,
      bookId: args.bookId,
      chapterNumber: args.chapterNumber,
      position: args.position,
      label: args.label,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.bookmarkId);
  },
});
