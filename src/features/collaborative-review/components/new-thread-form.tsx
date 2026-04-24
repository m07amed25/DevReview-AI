"use client";

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/select";
import { FileCode2, X, Send, Loader2 } from "lucide-react";

interface NewThreadFormProps {
  reviewId: string;
  onCancel: () => void;
  onCreated: () => void;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
  prFiles: string[];
}

export function NewThreadForm({
  reviewId,
  onCancel,
  onCreated,
  currentUserId,
  currentUserName,
  triggerTyping,
  prFiles,
}: NewThreadFormProps) {
  const [file, setFile] = useState("");
  const [line, setLine] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createThread = trpc.collaboration.createThread.useMutation({
    onSuccess: () => onCreated(),
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createThread.mutate({
      reviewId,
      file: file || "general",
      line: parseInt(line) || 0,
      content: content.trim(),
    });
  };

  return (
    <Card className="border-primary/20 shadow-sm shadow-primary/5">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Start a New Discussion
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-muted"
              onClick={onCancel}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/50 z-10">
                <FileCode2 className="size-4" />
              </div>
              <DropdownSelect
                value={file}
                onValueChange={setFile}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border shadow-sm text-foreground bg-background focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors"
                placeholder="File path (optional)"
              >
                <option value="general">General (No specific file)</option>
                {prFiles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </DropdownSelect>
            </div>
            <div className="relative w-28">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/50 text-sm font-mono">
                :
              </span>
              <input
                type="number"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="Line"
                className="w-full h-9 pl-7 pr-3 text-sm rounded-lg border border-border shadow-sm bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors"
              />
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              triggerTyping(currentUserId, currentUserName);
            }}
            placeholder="Write your comment…"
            rows={3}
            className="w-full px-4 py-3 text-sm rounded-lg border border-border shadow-sm bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors resize-none leading-relaxed"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="gap-2 shadow-sm px-6 font-medium"
              disabled={!content.trim() || createThread.isPending}
            >
              {createThread.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Start Discussion
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
