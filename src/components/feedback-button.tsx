"use client";

import { useState } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Bug,
  Lightbulb,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

type Category = "bug" | "feature" | "general";

const CATEGORIES: {
  value: Category;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature", icon: Lightbulb },
  { value: "general", label: "General", icon: MessageCircle },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.admin.submitSupportMessage.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setEmail("");
      setCategory("general");
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 2800);
    },
  });

  function handleClose() {
    setOpen(false);
    setSubmitted(false);
    setMessage("");
    setEmail("");
    setCategory("general");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const categoryLabel =
      CATEGORIES.find((c) => c.value === category)?.label ?? "General";
    const fullMessage = `[${categoryLabel}] ${message.trim()}`;
    submit.mutate({
      message: fullMessage,
      ...(email.trim() ? { email: email.trim() } : {}),
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      <div
        className={[
          "w-85 rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden",
          "transition-all duration-300 ease-in-out origin-bottom-right",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Gradient header */}
        <div className="relative flex items-center justify-between px-4 py-3.5 bg-linear-to-r from-primary to-primary/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-foreground/15">
              <MessageSquarePlus className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-foreground leading-none">
                Send Feedback
              </p>
              <p className="text-[10px] text-primary-foreground/60 mt-0.5">
                We read every message
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/20 hover:text-primary-foreground"
            aria-label="Close feedback panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 ring-4 ring-green-500/20">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Thank you!</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your feedback has been received.
                  <br />
                  We&apos;ll review it shortly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Category
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={[
                        "flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-all",
                        category === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message textarea */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="feedback-message"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="feedback-message"
                  placeholder={
                    category === "bug"
                      ? "Describe what happened and how to reproduce it…"
                      : category === "feature"
                        ? "Describe the feature you'd like to see…"
                        : "Share your thoughts, ideas, or questions…"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-none text-sm"
                  disabled={submit.isPending}
                />
                <p className="text-right text-[10px] text-muted-foreground">
                  {message.length}/2000
                </p>
              </div>

              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="feedback-email"
                  className="text-xs font-medium text-muted-foreground flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Email{" "}
                  <span className="opacity-50">(optional — for replies)</span>
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-sm"
                  disabled={submit.isPending}
                />
              </div>

              {submit.error && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  Something went wrong. Please try again.
                </p>
              )}

              <Button
                type="submit"
                size="sm"
                className="w-full mt-0.5"
                disabled={!message.trim() || submit.isPending}
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-3.5 w-3.5" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Trigger button */}
      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label={open ? "Close feedback" : "Open feedback"}
      >
        <span
          className={[
            "absolute transition-all duration-200",
            open
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-50",
          ].join(" ")}
        >
          <X className="h-5 w-5" />
        </span>
        <span
          className={[
            "absolute transition-all duration-200",
            !open
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50",
          ].join(" ")}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </span>
      </Button>
    </div>
  );
}
