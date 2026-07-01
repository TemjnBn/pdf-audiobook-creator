import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user_book", (q) =>
        q.eq("userId", userId).eq("bookId", args.bookId),
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("bookmarks", {
      userId,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.bookmarkId);
  },
});
