import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const nonTextImageMode = v.union(
  v.literal("skip"),
  v.literal("summarize"),
  v.literal("ask"),
  v.literal("caption"),
);

export const nonTextTableMode = v.union(
  v.literal("skip"),
  v.literal("summarize_rows"),
  v.literal("row_by_row"),
  v.literal("structured_prose"),
);

export const nonTextEquationMode = v.union(
  v.literal("skip"),
  v.literal("plain_language"),
  v.literal("latex"),
);

export const nonTextFootnoteMode = v.union(
  v.literal("skip"),
  v.literal("read_inline"),
  v.literal("end_of_chapter"),
);

export const nonTextCodeMode = v.union(
  v.literal("skip"),
  v.literal("pseudocode"),
);

export const pauseBehavior = v.union(
  v.literal("sentence"),
  v.literal("paragraph"),
  v.literal("continuous"),
);

export const readingStyle = v.union(
  v.literal("narration"),
  v.literal("conversational"),
  v.literal("dramatic"),
  v.literal("whispered"),
);

export const summarySource = v.union(
  v.literal("ai_generated"),
  v.literal("alt_text"),
  v.literal("surrounding_context"),
);

export const voiceGender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("non_binary"),
);

export const ttsProvider = v.union(
  v.literal("elevenlabs"),
  v.literal("google_cloud"),
  v.literal("openai"),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    books: defineTable({
      userId: v.id("users"),
      title: v.string(),
      author: v.optional(v.string()),
      fileName: v.string(),
      fileStorageId: v.optional(v.id("_storage")),
      coverImageStorageId: v.optional(v.id("_storage")),
      pageCount: v.optional(v.number()),
      isScanned: v.optional(v.boolean()),
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
      language: v.optional(v.string()),
      // Selected voice and settings for this book
      voiceId: v.optional(v.string()),
      ttsProvider: v.optional(ttsProvider),
      readingSpeed: v.optional(v.number()),
      readingStyle: v.optional(readingStyle),
      pauseBehavior: v.optional(pauseBehavior),
      // Generation progress
      lastListenedChapter: v.optional(v.number()),
      lastListenedPosition: v.optional(v.number()),
      // Content handling settings
      imageMode: v.optional(nonTextImageMode),
      imageSummaryLength: v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("detailed"))),
      imageSummarySource: v.optional(summarySource),
      tableMode: v.optional(nonTextTableMode),
      equationMode: v.optional(nonTextEquationMode),
      footnoteMode: v.optional(nonTextFootnoteMode),
      codeMode: v.optional(nonTextCodeMode),
      sleepTimerMinutes: v.optional(v.number()),
      backgroundPlayback: v.optional(v.boolean()),
      skipIntroPages: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"]),

    chapters: defineTable({
      bookId: v.id("books"),
      chapterNumber: v.number(),
      title: v.optional(v.string()),
      text: v.string(),
      wordCount: v.optional(v.number()),
      // Audio generation
      audioStorageId: v.optional(v.id("_storage")),
      audioDuration: v.optional(v.number()),
      generationStatus: v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("completed"),
        v.literal("error"),
      ),
      errorMessage: v.optional(v.string()),
    })
      .index("by_book", ["bookId"])
      .index("by_book_chapter", ["bookId", "chapterNumber"]),

    voices: defineTable({
      userId: v.id("users"),
      provider: ttsProvider,
      voiceId: v.string(),
      name: v.string(),
      language: v.string(),
      accent: v.optional(v.string()),
      gender: v.optional(voiceGender),
      tags: v.optional(v.array(v.string())),
      previewUrl: v.optional(v.string()),
      isCloned: v.optional(v.boolean()),
      isDefault: v.optional(v.boolean()),
      apiMetadata: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_provider", ["provider"]),

    generationJobs: defineTable({
      bookId: v.id("books"),
      userId: v.id("users"),
      status: v.union(
        v.literal("queued"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("error"),
      ),
      currentChapter: v.optional(v.number()),
      totalChapters: v.optional(v.number()),
      progress: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      estimatedCost: v.optional(v.number()),
    })
      .index("by_book", ["bookId"])
      .index("by_user", ["userId"]),

    bookmarks: defineTable({
      userId: v.id("users"),
      bookId: v.id("books"),
      chapterNumber: v.number(),
      position: v.number(),
      label: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_user_book", ["userId", "bookId"])
      .index("by_book", ["bookId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
