"use client";

import { useState } from "react";
import { Construction, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MaintenancePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = trpc.admin.submitSupportMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent! We'll get back to you soon.");
      setIsOpen(false);
      setMessage("");
      setEmail("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate({ email: email || undefined, message });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
        <Construction className="h-10 w-10 text-amber-500" />
      </div>
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
        System Under Maintenance
      </h1>
      <p className="mb-8 max-w-[500px] text-lg text-muted-foreground">
        We&apos;re currently performing some scheduled upgrades to improve your
        experience. Please check back shortly!
      </p>
      <div className="flex gap-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Contact Support</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Send a Message</DialogTitle>
                <DialogDescription>
                  Need help or want to report an issue? Leave us a message
                  below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2 text-left">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    required
                    placeholder="Describe your issue or question..."
                    className="min-h-[120px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={submitMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  {submitMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <p className="mt-12 text-sm text-muted-foreground italic">
        &quot;Refactoring the universe, one line at a time.&quot;
      </p>
    </div>
  );
}
