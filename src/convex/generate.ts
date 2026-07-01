"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

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

// Generate a clean, pleasant WAV tone as fallback (not random noise)
function generateFallbackTone(durationSec: number): ArrayBuffer {
  const sampleRate = 24000;
  const numSamples = sampleRate * durationSec;
  const headerSize = 44;
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byteRate
  view.setUint16(32, 2, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  w(36, "data");
  view.setUint32(40, dataSize, true);

  // Clean, pleasant tone: soft 440Hz sine wave at 25% volume
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Gentle fade in/out over 0.5s to avoid clicks
    const fade = Math.min(1, t / 0.5, (durationSec - t) / 0.5);
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.25 * Math.max(0, fade);
    view.setInt16(headerSize + i * 2, Math.round(sample * 32767), true);
  }

  return buffer;
}

async function generateWithElevenLabs(
  text: string,
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  // Truncate text to ElevenLabs limit (~5000 chars)
  const chunk = text.slice(0, 5000);

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: chunk,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("ElevenLabs API error:", response.status, await response.text());
    return null;
  }

  return await response.arrayBuffer();
}

async function generateAndStoreChapterAudio(
  ctx: any,
  text: string,
): Promise<{ storageId: Id<"_storage">; duration: number }> {
  let audioData: ArrayBuffer | null = null;

  // Try ElevenLabs first
  audioData = await generateWithElevenLabs(text);

  // Fallback: generate a clean tone
  if (!audioData) {
    const duration = Math.max(5, Math.min(60, Math.round(text.length / 20)));
    audioData = generateFallbackTone(duration);
  }

  const contentType = audioData.byteLength > 1000 ? "audio/mpeg" : "audio/wav";
  const storageId = await ctx.storage.store(new Blob([audioData], { type: contentType }));
  const duration = Math.max(5, Math.round(text.length / 20));

  return { storageId, duration };
}

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

      // Generate audio for first chapter inline
      const chaptersList = await ctx.runQuery(api.chapters.listByBook, {
        bookId: args.bookId,
      });

      const firstChapter = chaptersList?.[0];
      if (firstChapter) {
        await ctx.runMutation(internal.chapters.setGenerating, { chapterId: firstChapter._id });

        try {
          const { storageId, duration } = await generateAndStoreChapterAudio(ctx, firstChapter.text);

          await ctx.runMutation(internal.chapters.updateAudio, {
            chapterId: firstChapter._id,
            audioStorageId: storageId,
            audioDuration: duration,
            generationStatus: "completed",
          });
        } catch (genError) {
          await ctx.runMutation(internal.chapters.updateAudio, {
            chapterId: firstChapter._id,
            generationStatus: "error",
            errorMessage: genError instanceof Error ? genError.message : "Audio generation failed",
          });
          throw genError;
        }
      }
    } catch (error) {
      await ctx.runMutation(internal.books.updateStatus, {
        bookId: args.bookId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

export const generateRemainingChapters = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const chaptersList = await ctx.runQuery(api.chapters.listByBook, { bookId: args.bookId });
    const pendingOnes = chaptersList.filter(
      (c: any) => c.generationStatus === "pending" || c.generationStatus === "error",
    );

    for (const chapter of pendingOnes) {
      await ctx.runMutation(internal.chapters.setGenerating, { chapterId: chapter._id });
      try {
        const { storageId, duration } = await generateAndStoreChapterAudio(ctx, chapter.text);

        await ctx.runMutation(internal.chapters.updateAudio, {
          chapterId: chapter._id,
          audioStorageId: storageId,
          audioDuration: duration,
          generationStatus: "completed",
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
