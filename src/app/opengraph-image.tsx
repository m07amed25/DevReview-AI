/* eslint-disable react/forbid-dom-props */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DevReview AI – Smart Automated Code Reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #1e1b4b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "9999px",
            padding: "6px 18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#818cf8",
            }}
          />
          <span style={{ color: "#a5b4fc", fontSize: "16px", fontWeight: 600 }}>
            AI-Powered Code Reviews
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#f4f4f5",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-2px",
          }}
        >
          DevReview{" "}
          <span style={{ color: "#818cf8" }}>AI</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Catch bugs, security issues, and code quality problems before they
          reach production — directly in your GitHub pull requests.
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            display: "flex",
            gap: "32px",
            alignItems: "center",
          }}
        >
          {["Bug Detection", "Security Analysis", "Code Quality", "GitHub Integration"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#71717a",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#6366f1",
                  }}
                />
                {feature}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
