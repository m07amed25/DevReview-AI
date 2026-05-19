"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Send, Loader2, Users, Check, ImagePlus, Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Target = "ALL" | "FREE" | "PRO";

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<Target>("ALL");
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: count } = trpc.admin.recipientCount.useQuery({ target });
  const sendMutation = trpc.admin.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setSubject("");
      setBody("");
      setTimeout(() => setSent(false), 5000);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        const markdown = `![${file.name}](${data.url})\n`;
        const ta = textareaRef.current;
        if (ta) {
          const pos = ta.selectionStart ?? body.length;
          setBody(body.slice(0, pos) + markdown + body.slice(pos));
        } else {
          setBody(body + markdown);
        }
      }
    } catch {
      // silent fail
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    sendMutation.mutate({ subject, body, target });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
          <Newspaper className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-sm text-muted-foreground">
            Send emails to all registered users
          </p>
        </div>
      </div>

      {sent && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="h-4 w-4" />
          Newsletter queued successfully!
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compose Newsletter</CardTitle>
          <CardDescription>
            Write your message using Markdown. It will be rendered as HTML in the email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target audience */}
          <div className="space-y-2">
            <Label>Audience</Label>
            <div className="flex items-center gap-2">
              {(["ALL", "FREE", "PRO"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    target === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "ALL" ? "All Users" : t === "FREE" ? "Free Plan" : "Pro & Ultra"}
                </button>
              ))}
              <Badge variant="outline" className="ml-2 gap-1">
                <Users className="h-3 w-3" />
                {count ?? "..."} recipients
              </Badge>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's new at Code Catch..."
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Body (Markdown)</Label>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  Add Image
                </Button>
              </div>
            </div>
            <Textarea
              id="body"
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"# Hello!\n\nWe have exciting news to share...\n\n- Feature 1\n- Feature 2\n\n[Learn more](https://example.com)"}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Send */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Emails are sent in the background via the job queue.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!body.trim()}
                className="gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide Preview" : "Preview"}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject.trim() || !body.trim() || sendMutation.isPending}
                className="gap-2"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Newsletter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Email Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white p-8 shadow-sm dark:bg-zinc-950">
              {/* Simulated email header */}
              <div className="mb-6 border-b pb-4">
                <p className="text-xs text-muted-foreground">From: Code Catch &lt;noreply@codecatch.dev&gt;</p>
                <p className="text-xs text-muted-foreground">To: All {target === "ALL" ? "users" : target === "FREE" ? "free plan users" : "pro & ultra users"}</p>
                <p className="mt-1 text-sm font-semibold">{subject || "(No subject)"}</p>
              </div>
              {/* Rendered body */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{body || "*No content yet*"}</ReactMarkdown>
                <hr className="my-4" />
                <p className="text-xs text-muted-foreground">
                  Sent from CodeCatch. If you wish to unsubscribe, manage your notification settings in your profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
