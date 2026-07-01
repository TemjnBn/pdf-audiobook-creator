"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Simulated PDF parsing - extracts text and structure from a PDF
// In production, this would use pdf.js, pdf-parse, or an external API
async function parsePdfContent(
  storageId: string,
): Promise<{
  chapters: { title: string; text: string; wordCount: number }[];
  isScanned: boolean;
  totalImages: number;
  totalTables: number;
  totalEquations: number;
  totalChapters: number;
  title: string;
  author?: string;
}> {
  // Simulate PDF parsing for now
  // In a real implementation, this would download the file from Convex storage
  // and process it with pdf-parse or similar library
  
  // For demo/placeholder purposes, return sample parsed content
  return {
    title: "Uploaded Document",
    chapters: [
      {
        title: "Chapter 1: Introduction",
        text: "Welcome to this audiobook. This is the first chapter which introduces the main concepts and themes that will be explored throughout the book. The journey begins here with an exploration of foundational ideas that set the stage for deeper understanding.\n\nAs we progress through this chapter, we will examine the key principles that underpin the subject matter. These principles form the bedrock upon which subsequent chapters will build. It is essential to grasp these core concepts thoroughly before moving forward.\n\nLet us begin our exploration with an open mind and a willingness to engage with new ideas. The path ahead is rich with discovery and insight.",
        wordCount: 115,
      },
      {
        title: "Chapter 2: Core Principles",
        text: "In this chapter, we delve deeper into the core principles that drive the subject forward. Building upon the foundation laid in the introduction, we now explore more complex interrelationships between key concepts.\n\nThe first principle we examine is the relationship between theory and practice. Understanding how abstract ideas translate into real-world applications is crucial for mastering any discipline. We must consider not only what the theories state but also how they manifest in tangible outcomes.\n\nAnother important aspect is the role of critical thinking in evaluating new information. As we encounter various perspectives and arguments, developing the ability to assess them critically becomes invaluable. This skill allows us to separate robust ideas from flawed reasoning.\n\nWe conclude this chapter with a synthesis of the principles discussed, showing how they interconnect to form a coherent framework for understanding the broader subject.",
        wordCount: 140,
      },
      {
        title: "Chapter 3: Practical Applications",
        text: "Having established a solid theoretical foundation, this chapter focuses on the practical applications of the concepts we have explored. Theory without practice remains abstract, and practice without theory lacks direction.\n\nWe begin by examining case studies that illustrate the principles in action. These real-world examples demonstrate how the concepts we have discussed translate into effective strategies and solutions. Each case study highlights different aspects of the framework.\n\nThe practical exercises included in this chapter are designed to reinforce learning through active engagement. By working through these exercises, you will develop a deeper, more intuitive understanding of the material.\n\nFinally, we discuss common pitfalls and challenges encountered when applying these principles, along with strategies for overcoming them. This practical wisdom comes from extensive experience and will help you navigate complex situations with confidence.",
        wordCount: 145,
      },
    ],
    isScanned: false,
    totalImages: 5,
    totalTables: 3,
    totalEquations: 2,
    totalChapters: 3,
  };
}

// Simulated TTS generation
async function generateChapterAudio(
  text: string,
  voiceId: string,
  provider: string,
  speed: number,
): Promise<{ audioData: ArrayBuffer; duration: number }> {
  const duration = Math.max(10, Math.round(text.length / 15 / speed));
  
  // Generate a simple WAV file (sine wave audio)
  const sampleRate = 24000;
  const numSamples = sampleRate * duration;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 220 * t) * 0.3;
    const sampleValue = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(headerSize + i * 2, sampleValue, true);
  }
  
  return { audioData: buffer, duration };
}

export const generateChapter = action({
  args: { chapterId: v.id("chapters"), voiceId: v.string(), provider: v.string(), speed: v.number() },
  handler: async (ctx, args) => {
    const chapter = await ctx.runQuery(internal.chapters.getById, { chapterId: args.chapterId });
    if (!chapter) throw new Error("Chapter not found");

    const { audioData, duration } = await generateChapterAudio(
      chapter.text,
      args.voiceId,
      args.provider,
      args.speed,
    );

    const storageId = await ctx.storage.store(new Blob([audioData], { type: "audio/wav" }));

    await ctx.runMutation(internal.chapters.updateAudio, {
      chapterId: args.chapterId,
      audioStorageId: storageId,
      audioDuration: duration,
      generationStatus: "completed",
    });

    return { audioStorageId: storageId, duration };
  },
});

export const startGeneration = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const book = await ctx.runQuery(internal.books.getById, { bookId: args.bookId });
    if (!book) throw new Error("Book not found");

    await ctx.runMutation(internal.books.updateStatus, {
      bookId: args.bookId,
      status: "parsing",
    });

    try {
      const parsed = await parsePdfContent(book.fileStorageId!);

      const chapters = parsed.chapters.map((ch, i) => ({
        bookId: args.bookId,
        chapterNumber: i + 1,
        title: ch.title,
        text: ch.text,
        wordCount: ch.wordCount,
      }));

      await ctx.runMutation(internal.chapters.createBatch, { chapters });

      await ctx.runMutation(internal.books.updateStatus, {
        bookId: args.bookId,
        status: "parsed",
        totalChapters: parsed.chapters.length,
        totalImages: parsed.totalImages,
        totalTables: parsed.totalTables,
        totalEquations: parsed.totalEquations,
        isScanned: parsed.isScanned,
      });

      // Generate first chapter immediately
      const chaptersList = await ctx.runQuery(api.chapters.listByBook, {
        bookId: args.bookId,
      });

      const firstChapter = chaptersList?.[0];

      if (firstChapter) {
        await ctx.scheduler.runAfter(0, api.generate.generateChapter, {
          chapterId: firstChapter._id,
          voiceId: book.voiceId ?? "default",
          provider: book.ttsProvider ?? "elevenlabs",
          speed: book.readingSpeed ?? 1.0,
        });
      }
    } catch (error) {
      await ctx.runMutation(internal.books.updateStatus, {
        bookId: args.bookId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

export const generateRemainingChapters = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const book = await ctx.runQuery(internal.books.getById, { bookId: args.bookId });
    if (!book) throw new Error("Book not found");
    if (!book.voiceId || !book.ttsProvider) return;

    const pendingChapters = await ctx.runQuery(api.chapters.listByBook, { bookId: args.bookId });
    const pendingOnes = pendingChapters.filter((c) => c.generationStatus === "pending" || c.generationStatus === "error");

    for (const chapter of pendingOnes) {
      await ctx.runMutation(internal.chapters.setGenerating, { chapterId: chapter._id });
      try {
        await ctx.scheduler.runAfter(0, api.generate.generateChapter, {
          chapterId: chapter._id,
          voiceId: book.voiceId,
          provider: book.ttsProvider,
          speed: book.readingSpeed ?? 1.0,
        });
      } catch (error) {
        await ctx.runMutation(internal.chapters.updateAudio, {
          chapterId: chapter._id,
          generationStatus: "error",
          errorMessage: error instanceof Error ? error.message : "Generation failed",
        });
      }
    }
  },
});
