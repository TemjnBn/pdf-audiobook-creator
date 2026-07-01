import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, Mic, Settings2, Upload, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 },
};

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], ["rgba(255,255,255,0)", "rgba(255,255,255,0.8)"]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <motion.header
        style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: headerBg }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <Headphones className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-sm tracking-tight">AudiobookAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">How it works</a>
            {isLoading ? (
              <div className="w-20 h-8 rounded-md bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <Link to="/library">
                <Button size="sm" className="gap-1.5">
                  My Library <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-foreground/[0.02] blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div {...fadeInUp}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-muted/50 text-xs text-muted-foreground mb-8">
              <Sparkles className="w-3 h-3" />
              AI-powered PDF-to-Audiobook conversion
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0, 1], delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl mx-auto leading-[1.08]"
          >
            Turn any PDF into a
            <br />
            <span className="text-muted-foreground">natural-sounding audiobook</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1], delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-balance leading-relaxed"
          >
            Upload a PDF, choose your narrator's voice, adjust how non-text content is handled, and listen — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0, 1], delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {isAuthenticated ? (
              <Link to="/library">
                <Button size="lg" className="gap-2 text-base h-12 px-8">
                  Go to Library <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="gap-2 text-base h-12 px-8">
                    Get started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="text-base h-12 px-8">
                    Try as guest
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything you need</h2>
            <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto">
              From PDF parsing to polished audiobook export — built for long-form content.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "PDF Ingestion",
                description: "Drag-and-drop upload or URL import. Automatically detects text vs. scanned PDFs and preserves structure.",
              },
              {
                icon: Mic,
                title: "Voice Selection",
                description: "Choose from a library of voices by language, accent, gender, and tone. Preview before committing.",
              },
              {
                icon: Settings2,
                title: "Content Handling",
                description: "Control how images, tables, equations, and footnotes are narrated. Skip, summarize, or read aloud.",
              },
              {
                icon: Headphones,
                title: "Smart Playback",
                description: "Adjust speed from 0.5× to 3×, set sleep timers, and pick reading styles from narration to dramatic.",
              },
              {
                icon: BookOpen,
                title: "Reading Profiles",
                description: "Your voice, speed, and content settings are saved per book. Resume from where you left off.",
              },
              {
                icon: Sparkles,
                title: "Audio Export",
                description: "Download as per-chapter audio files or a single .m4b with chapter markers.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0, 1] }}
                className="group"
              >
                <div className="p-6 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-foreground/[0.04] border flex items-center justify-center mb-4">
                    <feature.icon className="w-4.5 h-4.5 text-foreground/70" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto">
              Three simple steps to turn your PDF into a listening experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Upload", description: "Drag your PDF or paste a URL. We parse the text, detect chapters, and extract structure — images, tables, and all." },
              { step: "02", title: "Configure", description: "Choose a voice, adjust reading speed, and set how non-text content is handled. Preview a sample before you generate." },
              { step: "03", title: "Listen", description: "Start streaming chapter 1 within seconds. Adjust settings on the fly, set a sleep timer, or export your audiobook." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.1, 0, 1] }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-5 text-xs font-bold tracking-wider">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to start listening?</h2>
            <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
              Upload your first PDF and hear it read aloud in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link to="/library">
                  <Button size="lg" className="gap-2 text-base h-12 px-8">
                    My Library <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="gap-2 text-base h-12 px-8">
                      Get started for free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <Headphones className="w-3 h-3 text-background" />
            </div>
            <span className="text-xs text-muted-foreground">AudiobookAI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AudiobookAI. All rights reserved.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
