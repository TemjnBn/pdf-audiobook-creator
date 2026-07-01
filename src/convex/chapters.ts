import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("asc")
      .collect();
  },
});

export const getByBookAndNumber = query({
  args: { bookId: v.id("books"), chapterNumber: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("chapters")
      .withIndex("by_book_chapter", (q) =>
        q.eq("bookId", args.bookId).eq("chapterNumber", args.chapterNumber),
      )
      .first();
  },
});

export const getById = internalQuery({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chapterId);
  },
});

export const createBatch = internalMutation({
  args: {
    chapters: v.array(
      v.object({
        bookId: v.id("books"),
        chapterNumber: v.number(),
        title: v.optional(v.string()),
        text: v.string(),
        wordCount: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const chapter of args.chapters) {
      await ctx.db.insert("chapters", {
        ...chapter,
        generationStatus: "pending",
      });
    }
  },
});

export const updateAudio = internalMutation({
  args: {
    chapterId: v.id("chapters"),
    audioStorageId: v.id("_storage"),
    audioDuration: v.optional(v.number()),
    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("error"),
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      audioStorageId: args.audioStorageId,
      generationStatus: args.generationStatus,
    };
    if (args.audioDuration !== undefined) patch.audioDuration = args.audioDuration;
    if (args.errorMessage !== undefined) patch.errorMessage = args.errorMessage;
    await ctx.db.patch(args.chapterId, patch);
  },
});

export const getPendingChapters = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .filter((q) => q.eq(q.field("generationStatus"), "pending"))
      .order("asc")
      .collect();
  },
});

export const setGenerating = internalMutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, { generationStatus: "generating" });
  },
});
