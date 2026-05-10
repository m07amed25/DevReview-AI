import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Code Catch team — coming soon.",
};

export default function ContactPage() {
  return (
    <ComingSoonPage
      title="Contact Us"
      description="A proper contact form is on its way. In the meantime, reach us at codecatch27@gmail.com."
    />
  );
}
