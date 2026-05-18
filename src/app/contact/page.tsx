import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us - Code Catch",
  description: "Get in touch with the Code Catch team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Info cards */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-6">
              <Mail className="h-5 w-5 text-indigo-500 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Email</h3>
              <a href="mailto:codecatch27@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                codecatch27@gmail.com
              </a>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Clock className="h-5 w-5 text-indigo-500 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Response time</h3>
              <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <MapPin className="h-5 w-5 text-indigo-500 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">Remote-first team</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
