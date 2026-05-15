import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BroadcastEmailProps {
  subject: string;
  body: string; // This can be HTML or plain text
  userName?: string;
  appUrl: string;
}

export const BroadcastEmail = ({
  subject,
  body,
  userName,
  appUrl,
}: BroadcastEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{subject}</Heading>
          <Text style={text}>Hi {userName || "there"},</Text>
          <Section style={section}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <Heading as="h2" style={h2} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <Heading as="h3" style={h3} {...props} />
                ),
                p: ({ node, ...props }) => <Text style={text} {...props} />,
                a: ({ node, ...props }) => <Link style={link} {...props} />,
                img: ({ node, ...props }) => <img style={image} {...props} />,
                ul: ({ node, ...props }) => <ul style={list} {...props} />,
                ol: ({ node, ...props }) => <ol style={list} {...props} />,
                li: ({ node, ...props }) => <li style={listItem} {...props} />,
                code: ({ node, ...props }) => <code style={code} {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote style={blockquote} {...props} />
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Sent from{" "}
              <Link href={appUrl} style={link}>
                CodeCatch
              </Link>
            </Text>
            <Text style={footerText}>
              If you wish to unsubscribe from these updates, you can manage your
              notification settings in your profile.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const renderBroadcastEmail = async (props: BroadcastEmailProps) => {
  return await render(<BroadcastEmail {...props} />);
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "36px",
  margin: "0 0 24px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "24px 0 16px",
};

const h3 = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "20px 0 12px",
};

const text = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const image = {
  maxWidth: "100%",
  borderRadius: "8px",
  margin: "16px 0",
};

const list = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
  paddingLeft: "24px",
};

const listItem = {
  marginBottom: "8px",
};

const code = {
  backgroundColor: "#f4f4f4",
  padding: "2px 4px",
  borderRadius: "4px",
  fontFamily: "monospace",
  fontSize: "14px",
};

const blockquote = {
  borderLeft: "4px solid #e6ebf1",
  paddingLeft: "16px",
  margin: "16px 0",
  color: "#666",
  fontStyle: "italic",
};

const section = {
  margin: "24px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footer = {
  marginTop: "32px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0",
};
