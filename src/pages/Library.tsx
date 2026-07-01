import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BookOpen, Headphones, Loader2, Plus, Trash2, Upload as UploadIcon, FileText, Play, Settings, Clock, Image, LayoutGrid, Sigma } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createBook = useMutation(api.books.create);
  const navigate = useNavigate();
  const generateStorageUrl = useMutation(api.storage.generateUploadUrl);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateStorageUrl();
      
      // Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const { storageId } = await response.json();
      
      // Create book record
      const bookId = await createBook({
        title: file.name.replace(/\.pdf$/i, ""),
        fileName: file.name,
        fileStorageId: storageId as Id<"_storage">,
      });

      toast.success("PDF uploaded successfully");
      onClose();
      navigate(`/reader/${bookId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0, 1] }}
        className="bg-background rounded-xl border shadow-sm w-full max-w-md p-8 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight mb-1">Upload PDF</h2>
        <p className="text-sm text-muted-foreground mb-6">Drag and drop a PDF file, or click to browse.</p>

        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            dragActive ? "border-foreground bg-muted/50" : "border-border hover:border-muted-foreground/30"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UploadIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">
            {isUploading ? "Uploading..." : "Drop your PDF here"}
          </p>
          <p className="text-xs text-muted-foreground">or click to browse files</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing your PDF...
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function BookCard({ book }: { book: { _id: Id<"books">; title: string; status: string; pageCount?: number; totalChapters?: number; totalImages?: number; totalTables?: number; totalEquations?: number; readingSpeed?: number; voiceId?: string | null } }) {
  const navigate = useNavigate();
  const deleteBook = useMutation(api.books.remove);
  const [deleting, setDeleting] = useState(false);

  const statusLabel = {
    uploaded: "Uploaded",
    parsing: "Parsing...",
    parsed: "Ready",
    error: "Error",
  }[book.status] ?? book.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
    >
      <Card className="group cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden">
        <div onClick={() => navigate(`/reader/${book._id}`)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-foreground/[0.04] border flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate max-w-[200px]">{book.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {book.totalChapters ? `${book.totalChapters} chapters` : book.pageCount ? `${book.pageCount} pages` : "Processing..."}
                  </CardDescription>
                </div>
              </div>
              <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                book.status === "parsed" ? "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-900" :
                book.status === "error" ? "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-900" :
                book.status === "parsing" ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-900" :
                "text-muted-foreground bg-muted border-border"
              }`}>
                {statusLabel}
              </div>
            </div>
          </CardHeader>
          {book.totalChapters && (
            <CardContent className="pb-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {book.totalImages !== undefined && (
                  <span className="flex items-center gap-1">
                    <Image className="w-3 h-3" /> {book.totalImages}
                  </span>
                )}
                {book.totalTables !== undefined && (
                  <span className="flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" /> {book.totalTables}
                  </span>
                )}
                {book.totalEquations !== undefined && (
                  <span className="flex items-center gap-1">
                    <Sigma className="w-3 h-3" /> {book.totalEquations}
                  </span>
                )}
                {book.voiceId && (
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3" /> Voice set
                  </span>
                )}
                {book.readingSpeed && book.readingSpeed !== 1.0 && (
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> {book.readingSpeed}×
                  </span>
                )}
              </div>
            </CardContent>
          )}
        </div>
        <CardFooter className="border-t pt-3 pb-3 flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 h-8"
            onClick={() => navigate(`/reader/${book._id}`)}
          >
            <Play className="w-3.5 h-3.5" />
            {book.status === "parsed" ? "Listen" : "View"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive h-8"
            onClick={async (e) => {
              e.stopPropagation();
              setDeleting(true);
              try {
                await deleteBook({ bookId: book._id });
                toast.success("Book deleted");
              } catch {
                toast.error("Failed to delete");
              }
              setDeleting(false);
            }}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function Library() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const books = useQuery(api.books.list);
  const [showUpload, setShowUpload] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <Headphones className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-sm tracking-tight">AudiobookAI</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Upload PDF
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {books ? `${books.length} book${books.length !== 1 ? "s" : ""}` : "Loading..."}
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="gap-1.5">
            <UploadIcon className="w-4 h-4" />
            Upload PDF
          </Button>
        </div>

        {!books ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No books yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Upload your first PDF to start converting it into an audiobook.
            </p>
            <Button onClick={() => setShowUpload(true)} className="gap-1.5">
              <UploadIcon className="w-4 h-4" />
              Upload your first PDF
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        )}
      </main>

      {showUpload && <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} />}
    </motion.div>
  );
}
