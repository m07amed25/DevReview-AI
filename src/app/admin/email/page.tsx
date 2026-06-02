"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Mail,
  Send,
  Users,
  Layout,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye,
  Trash2,
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SelectItem,
  SelectRoot,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";

export default function EmailEnginePage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"ALL" | "FREE" | "PRO" | "CUSTOM">("ALL");
  const [customEmails, setCustomEmails] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    setBody(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        insertText(`![${file.name}](${data.url})`);
        toast.success("Image uploaded!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const broadcastMutation = trpc.admin.sendBroadcastEmail.useMutation({
    onSuccess: () => {
      toast.success("Broadcast email queued successfully!");
      setSubject("");
      setBody("");
      setCustomEmails("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send broadcast email");
    },
  });

  const sendTestMutation = trpc.admin.sendTestBroadcastEmail.useMutation({
    onSuccess: () => {
      toast.success("Test email sent to your inbox!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test email");
    },
  });

  const handleSend = () => {
    if (!subject || !body) {
      toast.error("Please fill in both subject and body");
      return;
    }

    const targetValue = target === "CUSTOM" 
      ? customEmails.split(",").map(e => e.trim()).filter(e => e.includes("@"))
      : target;

    broadcastMutation.mutate({
      subject,
      body,
      target: targetValue as any,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10">
            <Mail className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Engine</h1>
            <p className="text-muted-foreground">Compose and broadcast emails to your users with ease.</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Compose Message</CardTitle>
                  <CardDescription>Use HTML or plain text for your email body.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="h-8 gap-2"
                  >
                    {isPreviewMode ? <Layout className="size-3.5" /> : <Eye className="size-3.5" />}
                    {isPreviewMode ? "Editor" : "Preview"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <AnimatePresence mode="wait">
                {!isPreviewMode ? (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        placeholder="Weekly Updates, Feature Announcements, etc."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-12 text-lg font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Email Body (Markdown supported)</Label>
                      
                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-t-lg border border-border/40 bg-muted/50">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("**", "**")} title="Bold">
                          <Bold className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("*", "*")} title="Italic">
                          <Italic className="size-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/60 mx-1" />
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("# ", "")} title="H1">
                          <Heading1 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("## ", "")} title="H2">
                          <Heading2 className="size-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/60 mx-1" />
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("- ", "")} title="Bullet List">
                          <List className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("1. ", "")} title="Ordered List">
                          <ListOrdered className="size-4" />
                        </Button>
                        <div className="w-px h-4 bg-border/60 mx-1" />
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("[", "](url)")} title="Link">
                          <LinkIcon className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8" 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={isUploading}
                          title="Image"
                        >
                          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("`", "`")} title="Inline Code">
                          <Code className="size-4" />
                        </Button>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                        />
                      </div>

                      <Textarea
                        id="body"
                        ref={textareaRef}
                        placeholder="Hi there,\n\nWe're excited to announce..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="min-h-[400px] font-mono text-sm leading-relaxed rounded-t-none border-t-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="rounded-lg border border-border/40 bg-muted/20 p-8 min-h-[464px] overflow-auto"
                  >
                    <div className="max-w-[600px] mx-auto bg-white dark:bg-zinc-950 rounded-xl shadow-2xl p-10 border border-border/40">
                      <h2 className="text-2xl font-bold mb-6 text-foreground">{subject || "No Subject Specified"}</h2>
                      <p className="text-muted-foreground mb-4">Hi User,</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {body || "*Message body will appear here...*"}
                        </ReactMarkdown>
                      </div>
                      <div className="mt-8 pt-6 border-t border-border/40 text-xs text-muted-foreground text-center">
                        Sent from CodeCatch
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                  onClick={() => {setSubject(""); setBody("");}}
                >
                  <Trash2 className="size-4 mr-2" />
                  Discard
                </Button>
                <div className="w-px h-4 bg-border/60 mx-1 hidden sm:block" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!subject || !body) return toast.error("Fill in subject and body first");
                    sendTestMutation.mutate({ subject, body });
                  }}
                  disabled={sendTestMutation.isPending || !subject || !body}
                  className="h-9"
                >
                  {sendTestMutation.isPending ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Eye className="size-3.5 mr-2" />}
                  Send Test
                </Button>
              </div>
              
              <Button 
                onClick={handleSend} 
                disabled={broadcastMutation.isPending || !subject || !body}
                className="px-8 shadow-lg shadow-primary/20 h-9"
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                {broadcastMutation.isPending ? "Queuing..." : "Broadcast Message"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar/Options Section */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                <Users className="size-4" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Segment</Label>
                <SelectRoot value={target} onValueChange={(v) => setTarget(v as any)}>
                  <SelectItem value="ALL">All Registered Users</SelectItem>
                  <SelectItem value="FREE">Free Plan Users</SelectItem>
                  <SelectItem value="PRO">Pro/Paid Plan Users</SelectItem>
                  <SelectItem value="CUSTOM">Specific Emails (Manual)</SelectItem>
                </SelectRoot>
              </div>

              <AnimatePresence>
                {target === "CUSTOM" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="custom-emails">Email List (Comma separated)</Label>
                    <Textarea
                      id="custom-emails"
                      placeholder="user1@example.com, user2@example.com"
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      className="h-24 text-xs"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                <Info className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Bulk sending uses Inngest background workers. Large audiences will be processed in chunks to ensure delivery.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg shadow-black/5 bg-amber-500/5 border-amber-500/10">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <ChevronRight className="size-3 mt-0.5 text-amber-500" />
                <p>Avoid sending too many marketing emails to prevent being flagged as spam.</p>
              </div>
              <div className="flex gap-2">
                <ChevronRight className="size-3 mt-0.5 text-amber-500" />
                <p>Always include a reason for the update if it&apos;s a feature change.</p>
              </div>
              <div className="flex gap-2">
                <ChevronRight className="size-3 mt-0.5 text-amber-500" />
                <p>Verify links and HTML tags before sending the broadcast.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
