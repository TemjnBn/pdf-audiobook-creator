import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

export const getById = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getByIdPublic = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    return book;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    fileName: v.string(),
    fileStorageId: v.id("_storage"),
    author: v.optional(v.string()),
    pageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const bookId = await ctx.db.insert("books", {
      userId,
      title: args.title,
      fileName: args.fileName,
      fileStorageId: args.fileStorageId,
      author: args.author,
      pageCount: args.pageCount,
      status: "uploaded",
      readingSpeed: 1.0,
      readingStyle: "narration",
      pauseBehavior: "paragraph",
      imageMode: "summarize",
      imageSummaryLength: "medium",
      imageSummarySource: "ai_generated",
      tableMode: "summarize_rows",
      equationMode: "plain_language",
      footnoteMode: "read_inline",
      codeMode: "pseudocode",
      sleepTimerMinutes: 30,
      backgroundPlayback: true,
      skipIntroPages: 0,
    });

    return bookId;
  },
});

export const updateStatus = internalMutation({
  args: {
    bookId: v.id("books"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("parsing"),
      v.literal("parsed"),
      v.literal("error"),
    ),
    errorMessage: v.optional(v.string()),
    totalChapters: v.optional(v.number()),
    totalImages: v.optional(v.number()),
    totalTables: v.optional(v.number()),
    totalEquations: v.optional(v.number()),
    isScanned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.errorMessage !== undefined) patch.errorMessage = args.errorMessage;
    if (args.totalChapters !== undefined) patch.totalChapters = args.totalChapters;
    if (args.totalImages !== undefined) patch.totalImages = args.totalImages;
    if (args.totalTables !== undefined) patch.totalTables = args.totalTables;
    if (args.totalEquations !== undefined) patch.totalEquations = args.totalEquations;
    if (args.isScanned !== undefined) patch.isScanned = args.isScanned;
    await ctx.db.patch(args.bookId, patch);
  },
});

export const updateSettings = mutation({
  args: {
    bookId: v.id("books"),
    voiceId: v.optional(v.string()),
    ttsProvider: v.optional(v.union(v.literal("elevenlabs"), v.literal("google_cloud"), v.literal("openai"))),
    readingSpeed: v.optional(v.number()),
    readingStyle: v.optional(v.union(v.literal("narration"), v.literal("conversational"), v.literal("dramatic"), v.literal("whispered"))),
    pauseBehavior: v.optional(v.union(v.literal("sentence"), v.literal("paragraph"), v.literal("continuous"))),
    imageMode: v.optional(v.union(v.literal("skip"), v.literal("summarize"), v.literal("ask"), v.literal("caption"))),
    imageSummaryLength: v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("detailed"))),
    imageSummarySource: v.optional(v.union(v.literal("ai_generated"), v.literal("alt_text"), v.literal("surrounding_context"))),
    tableMode: v.optional(v.union(v.literal("skip"), v.literal("summarize_rows"), v.literal("row_by_row"), v.literal("structured_prose"))),
    equationMode: v.optional(v.union(v.literal("skip"), v.literal("plain_language"), v.literal("latex"))),
    footnoteMode: v.optional(v.union(v.literal("skip"), v.literal("read_inline"), v.literal("end_of_chapter"))),
    codeMode: v.optional(v.union(v.literal("skip"), v.literal("pseudocode"))),
    sleepTimerMinutes: v.optional(v.number()),
    backgroundPlayback: v.optional(v.boolean()),
    skipIntroPages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { bookId, ...settings } = args;
    await ctx.db.patch(bookId, settings);
  },
});

export const updateProgress = mutation({
  args: {
    bookId: v.id("books"),
    chapterNumber: v.number(),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.bookId, {
      lastListenedChapter: args.chapterNumber,
      lastListenedPosition: args.position,
    });
  },
});

export const remove = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    await ctx.db.delete(args.bookId);
  },
});
