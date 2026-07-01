import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings2,
  Volume2,
  VolumeX,
  Loader2,
  Clock,
  BookOpen,
  Download,
  FileText,
  Mic,
  Image,
  Table2,
  Sigma,
  BookMarked,
  ChevronDown,
  Gauge,
  FileAudio,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Id, Doc } from "@/convex/_generated/dataModel";

type BookDoc = Doc<"books">;
type ChapterDoc = Doc<"chapters">;

function VoicePicker({
  bookId,
  currentVoiceId,
  currentProvider,
  onSelect,
}: {
  bookId: Id<"books">;
  currentVoiceId?: string | null;
  currentProvider?: string | null;
  onSelect: (voiceId: string, provider: string) => void;
}) {
  const [selectedVoice, setSelectedVoice] = useState(currentVoiceId ?? "");
  const [selectedProvider, setSelectedProvider] = useState(currentProvider ?? "elevenlabs");
  const [showCustom, setShowCustom] = useState(false);

  const presetVoices = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Warm", "Clear", "Narrative"], previewUrl: "" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Energetic", "Conversational"], previewUrl: "" },
    { id: "EXAVITQu4vrVxn15asko", name: "Bella", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Warm", "Calm", "Narrative"], previewUrl: "" },
    { id: "VR6AewLTigWG4xSOGBnR", name: "Antoni", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Authoritative", "Deep"], previewUrl: "" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Warm", "Narrative"], previewUrl: "" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", provider: "elevenlabs", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Deep", "Authoritative"], previewUrl: "" },
    { id: "N2lVS1w4EtoT3Ah4CKcr", name: "Emily", provider: "elevenlabs", language: "English (UK)", accent: "British", gender: "female" as const, tags: ["Calm", "Narrative"], previewUrl: "" },
    { id: "ODq5zmih8GrVes37Dizd", name: "Michael", provider: "elevenlabs", language: "English (UK)", accent: "British", gender: "male" as const, tags: ["Authoritative", "Warm"], previewUrl: "" },
    { id: "XrExE9yKIg1WjnnlVkGX", name: "Sofia", provider: "elevenlabs", language: "Spanish (Castilian)", accent: "European", gender: "female" as const, tags: ["Warm", "Clear"], previewUrl: "" },
    { id: "piTKgcLEGmPE4e6mEKli", name: "Daniel", provider: "elevenlabs", language: "Spanish (Latin)", accent: "Latin American", gender: "male" as const, tags: ["Narrative", "Calm"], previewUrl: "" },
    { id: "en-US-Standard-A", name: "Standard A", provider: "google_cloud", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Clear", "Natural"], previewUrl: "" },
    { id: "en-US-Standard-B", name: "Standard B", provider: "google_cloud", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Clear", "Natural"], previewUrl: "" },
    { id: "en-US-Standard-C", name: "Standard C", provider: "google_cloud", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Warm", "Natural"], previewUrl: "" },
    { id: "en-GB-Standard-A", name: "UK Standard", provider: "google_cloud", language: "English (UK)", accent: "British", gender: "female" as const, tags: ["Clear", "Authoritative"], previewUrl: "" },
    { id: "alloy", name: "Alloy", provider: "openai", language: "English (US)", accent: "American", gender: "non_binary" as const, tags: ["Balanced", "Natural"], previewUrl: "" },
    { id: "echo", name: "Echo", provider: "openai", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Deep", "Authoritative"], previewUrl: "" },
    { id: "fable", name: "Fable", provider: "openai", language: "English (UK)", accent: "British", gender: "female" as const, tags: ["Warm", "Narrative"], previewUrl: "" },
    { id: "onyx", name: "Onyx", provider: "openai", language: "English (US)", accent: "American", gender: "male" as const, tags: ["Deep", "Authoritative"], previewUrl: "" },
    { id: "nova", name: "Nova", provider: "openai", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Warm", "Calm"], previewUrl: "" },
    { id: "shimmer", name: "Shimmer", provider: "openai", language: "English (US)", accent: "American", gender: "female" as const, tags: ["Energetic", "Clear"], previewUrl: "" },
  ];

  const [filters, setFilters] = useState({ language: "", gender: "", tag: "" });

  const filteredVoices = presetVoices.filter((v) => {
    if (filters.language && v.language !== filters.language) return false;
    if (filters.gender && v.gender !== filters.gender) return false;
    if (filters.tag && !v.tags.some((t) => t.toLowerCase().includes(filters.tag.toLowerCase()))) return false;
    return true;
  });

  const languages = [...new Set(presetVoices.map((v) => v.language))];
  const genders = [...new Set(presetVoices.map((v) => v.gender))];
  const allTags = [...new Set(presetVoices.flatMap((v) => v.tags))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <select
            className="w-full h-9 rounded-md border bg-background px-3 text-xs"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
          >
            <option value="">All Languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            className="w-full h-9 rounded-md border bg-background px-3 text-xs"
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
          >
            <option value="">All Genders</option>
            {genders.map((g) => (
              <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredVoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No voices match your filters.</p>
        ) : (
          filteredVoices.map((voice) => (
            <button
              key={`${voice.provider}-${voice.id}`}
              onClick={() => {
                setSelectedVoice(voice.id);
                setSelectedProvider(voice.provider);
                onSelect(voice.id, voice.provider);
              }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedVoice === voice.id
                  ? "bg-foreground/[0.04] border-foreground/20"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{voice.name}</span>
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                  {voice.provider === "elevenlabs" ? "ElevenLabs" : voice.provider === "google_cloud" ? "Google" : "OpenAI"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{voice.language}</span>
                <span>·</span>
                <span className="capitalize">{voice.gender}</span>
              </div>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {voice.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Custom voice cloning</span>
        <Switch checked={showCustom} onCheckedChange={setShowCustom} />
      </div>

      {showCustom && (
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">
            Upload a reference recording (10–30 seconds of clear speech) to clone your voice.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            Upload sample
          </Button>
        </div>
      )}
    </div>
  );
}

function ContentSettings({ book }: { book: BookDoc }) {
  const updateSettings = useMutation(api.books.updateSettings);

  const handleChange = (key: string, value: unknown) => {
    updateSettings({ bookId: book._id, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Images */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Image className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Images & Illustrations</h4>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Mode</Label>
            <select
              className="w-full h-9 rounded-md border bg-background px-3 text-xs mt-1"
              value={book.imageMode ?? "summarize"}
              onChange={(e) => handleChange("imageMode", e.target.value)}
            >
              <option value="skip">Skip silently</option>
              <option value="summarize">Pause and summarize aloud</option>
              <option value="ask">Pause and ask before summarizing</option>
              <option value="caption">Read a one-line caption only</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Summary length</Label>
            <select
              className="w-full h-9 rounded-md border bg-background px-3 text-xs mt-1"
              value={book.imageSummaryLength ?? "medium"}
              onChange={(e) => handleChange("imageSummaryLength", e.target.value)}
            >
              <option value="short">Short (1 sentence)</option>
              <option value="medium">Medium (2–3 sentences)</option>
              <option value="detailed">Detailed (paragraph)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Summary source</Label>
            <select
              className="w-full h-9 rounded-md border bg-background px-3 text-xs mt-1"
              value={book.imageSummarySource ?? "ai_generated"}
              onChange={(e) => handleChange("imageSummarySource", e.target.value)}
            >
              <option value="ai_generated">AI-generated from image</option>
              <option value="alt_text">Existing alt-text in PDF</option>
              <option value="surrounding_context">Surrounding paragraph context</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tables */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Table2 className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Tables</h4>
        </div>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 text-xs"
          value={book.tableMode ?? "summarize_rows"}
          onChange={(e) => handleChange("tableMode", e.target.value)}
        >
          <option value="skip">Skip silently</option>
          <option value="summarize_rows">Summarize rows</option>
          <option value="row_by_row">Read row-by-row</option>
          <option value="structured_prose">Read as structured prose</option>
        </select>
      </div>

      <Separator />

      {/* Equations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sigma className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Equations & Formulas</h4>
        </div>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 text-xs"
          value={book.equationMode ?? "plain_language"}
          onChange={(e) => handleChange("equationMode", e.target.value)}
        >
          <option value="skip">Skip silently</option>
          <option value="plain_language">Read aloud in plain language</option>
          <option value="latex">Read LaTeX source</option>
        </select>
      </div>

      <Separator />

      {/* Footnotes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookMarked className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Footnotes & Citations</h4>
        </div>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 text-xs"
          value={book.footnoteMode ?? "read_inline"}
          onChange={(e) => handleChange("footnoteMode", e.target.value)}
        >
          <option value="skip">Skip silently</option>
          <option value="read_inline">Read inline</option>
          <option value="end_of_chapter">Read at end of chapter</option>
        </select>
      </div>

      <Separator />

      {/* Code */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Code Blocks</h4>
        </div>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 text-xs"
          value={book.codeMode ?? "pseudocode"}
          onChange={(e) => handleChange("codeMode", e.target.value)}
        >
          <option value="skip">Skip silently</option>
          <option value="pseudocode">Read as pseudocode narration</option>
        </select>
      </div>
    </div>
  );
}

function PlaybackSettings({ book }: { book: BookDoc }) {
  const updateSettings = useMutation(api.books.updateSettings);
  const startGeneration = useAction(api.generate.startGeneration);
  const generateRemaining = useAction(api.generate.generateRemainingChapters);

  const handleChange = (key: string, value: unknown) => {
    updateSettings({ bookId: book._id, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Reading Speed</h4>
          </div>
          <span className="text-xs font-medium">{book.readingSpeed?.toFixed(2)}×</span>
        </div>
        <Slider
          value={[book.readingSpeed ?? 1.0]}
          onValueChange={([v]) => handleChange("readingSpeed", Math.round(v * 4) / 4)}
          min={0.5}
          max={3.0}
          step={0.25}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0.5×</span>
          <span>1×</span>
          <span>2×</span>
          <span>3×</span>
        </div>
      </div>

      <Separator />

      {/* Reading Style */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Reading Style</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "narration", label: "Narration" },
            { value: "conversational", label: "Conversational" },
            { value: "dramatic", label: "Dramatic" },
            { value: "whispered", label: "Whispered" },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => handleChange("readingStyle", style.value)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                book.readingStyle === style.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Pause Behavior */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Pause Behavior</h4>
        </div>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 text-xs"
          value={book.pauseBehavior ?? "paragraph"}
          onChange={(e) => handleChange("pauseBehavior", e.target.value)}
        >
          <option value="sentence">Pause at each sentence</option>
          <option value="paragraph">Pause at each paragraph</option>
          <option value="continuous">Continuous reading</option>
        </select>
      </div>

      <Separator />

      {/* Sleep Timer */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Sleep Timer</h4>
        </div>
        <div className="flex items-center gap-2">
          {[5, 15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => handleChange("sleepTimerMinutes", m)}
              className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                book.sleepTimerMinutes === m
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Skip Intro Pages */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Skip Intro Pages</h4>
          </div>
          <span className="text-xs font-medium">{book.skipIntroPages ?? 0} pages</span>
        </div>
        <Slider
          value={[book.skipIntroPages ?? 0]}
          onValueChange={([v]) => handleChange("skipIntroPages", Math.round(v))}
          min={0}
          max={10}
          step={1}
          className="mt-2"
        />
      </div>

      <Separator />

      {/* Background Playback */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-muted-foreground" />
          <div>
            <h4 className="text-sm font-medium">Background Playback</h4>
            <p className="text-xs text-muted-foreground">Continue when tab is backgrounded</p>
          </div>
        </div>
        <Switch
          checked={book.backgroundPlayback ?? true}
          onCheckedChange={(v) => handleChange("backgroundPlayback", v)}
        />
      </div>

      <Separator />

      {/* Generate buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => {
            startGeneration({ bookId: book._id });
            toast.success("Starting generation...");
          }}
        >
          <FileAudio className="w-4 h-4" />
          Generate all chapters
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            generateRemaining({ bookId: book._id });
            toast.success("Generating remaining chapters...");
          }}
        >
          Regenerate remaining chapters
        </Button>
      </div>
    </div>
  );
}

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const book = useQuery(api.books.getByIdPublic, { bookId: bookId as Id<"books"> });
  const chapters = useQuery(api.chapters.listByBook, { bookId: bookId as Id<"books"> });
  const bookSettings = useMutation(api.books.updateSettings);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentChapter = chapters?.[currentChapterIndex];
  const audioUrl = useQuery(
    api.storage.getUrl,
    currentChapter?.audioStorageId ? { storageId: currentChapter.audioStorageId } : "skip",
  );

  useEffect(() => {
    if (book?.lastListenedChapter && chapters) {
      const idx = chapters.findIndex((c) => c.chapterNumber === book.lastListenedChapter);
      if (idx >= 0) setCurrentChapterIndex(idx);
    }
  }, [book, chapters]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSkipForward = useCallback(() => {
    if (chapters && currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [chapters, currentChapterIndex]);

  const handleSkipBack = useCallback(() => {
    setCurrentChapterIndex(currentChapterIndex - 1);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [currentChapterIndex]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Simple header */}
      <header className="border-b">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 h-14">
          <button onClick={() => navigate("/library")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Library
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate max-w-[200px]">{book.title}</span>
          </div>
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                  Adjust reading and content preferences for this book.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <Tabs defaultValue="playback">
                  <TabsList className="w-full">
                    <TabsTrigger value="playback" className="flex-1 text-xs">Playback</TabsTrigger>
                    <TabsTrigger value="content" className="flex-1 text-xs">Content</TabsTrigger>
                    <TabsTrigger value="voice" className="flex-1 text-xs">Voice</TabsTrigger>
                  </TabsList>
                  <TabsContent value="playback" className="mt-4">
                    <PlaybackSettings book={book} />
                  </TabsContent>
                  <TabsContent value="content" className="mt-4">
                    <ContentSettings book={book} />
                  </TabsContent>
                  <TabsContent value="voice" className="mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Mic className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Choose a Voice</h4>
                      </div>
                      <VoicePicker
                        bookId={book._id}
                        currentVoiceId={book.voiceId}
                        currentProvider={book.ttsProvider}
                        onSelect={(voiceId, provider) => {
                          bookSettings({ bookId: book._id, voiceId, ttsProvider: provider as any });
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Chapter display */}
        <div className="flex-1 mx-auto max-w-2xl w-full px-6 py-12 overflow-y-auto">
          {currentChapter ? (
            <motion.div
              key={currentChapter._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-muted-foreground font-medium mb-2">
                Chapter {currentChapter.chapterNumber}
              </p>
              <h2 className="text-xl font-bold tracking-tight mb-4">
                {currentChapter.title || `Chapter ${currentChapter.chapterNumber}`}
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                {currentChapter.text.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  key={audioUrl}
                  src={audioUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setCurrentTime(audioRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (audioRef.current) {
                      setDuration(audioRef.current.duration);
                    }
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    if (chapters && currentChapterIndex < chapters.length - 1) {
                      setCurrentChapterIndex(currentChapterIndex + 1);
                      setCurrentTime(0);
                    }
                  }}
                  preload="auto"
                />
              )}
            </motion.div>
          ) : (
            <div className="text-center py-24">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1">No chapters yet</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                This book hasn't been parsed yet. Open Settings and click "Generate all chapters" to start.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Open Settings
              </Button>
            </div>
          )}
        </div>

        {/* Player bar */}
        <div className="border-t bg-background">
          <div className="mx-auto max-w-4xl px-6 py-4">
            {/* Chapter selector */}
            {chapters && chapters.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-muted-foreground font-medium w-16">Chapter:</span>
                <select
                  className="flex-1 h-7 rounded border bg-background px-2 text-xs"
                  value={currentChapterIndex}
                  onChange={(e) => {
                    setCurrentChapterIndex(Number(e.target.value));
                    setCurrentTime(0);
                    setIsPlaying(false);
                  }}
                >
                  {chapters.map((ch, i) => (
                    <option key={ch._id} value={i}>
                      {ch.title || `${ch.chapterNumber}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted relative cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current && duration) {
                    audioRef.current.currentTime = pct * duration;
                    setCurrentTime(pct * duration);
                  }
                }}
              >
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={handleSkipBack}
                disabled={currentChapterIndex === 0}
                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={!currentChapter?.audioStorageId}
                className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={handleSkipForward}
                disabled={!chapters || currentChapterIndex >= chapters.length - 1}
                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-border mx-2" />

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={([v]) => {
                    setVolume(v);
                    setIsMuted(false);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
