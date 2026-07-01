import { v } from "convex/values";
import { mutation, internalMutation, query, internalQuery } from "./_generated/server";

export const getJobByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("generationJobs")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .first();
  },
});

export const createJob = internalMutation({
  args: {
    bookId: v.id("books"),
    userId: v.id("users"),
    totalChapters: v.number(),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("generationJobs", {
      bookId: args.bookId,
      userId: args.userId,
      status: "queued",
      totalChapters: args.totalChapters,
      currentChapter: 0,
      progress: 0,
      estimatedCost: args.estimatedCost,
    });
  },
});

export const updateJobProgress = internalMutation({
  args: {
    bookId: v.id("books"),
    currentChapter: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("error"),
    )),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .first();

    if (!job) return;

    const patch: Record<string, unknown> = {};
    if (args.currentChapter !== undefined) {
      patch.currentChapter = args.currentChapter;
      patch.progress = job.totalChapters
        ? Math.round((args.currentChapter / job.totalChapters) * 100)
        : 0;
    }
    if (args.status !== undefined) patch.status = args.status;
    if (args.errorMessage !== undefined) patch.errorMessage = args.errorMessage;

    await ctx.db.patch(job._id, patch);
  },
});

export const getJobStatus = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generationJobs")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .first();
  },
});
