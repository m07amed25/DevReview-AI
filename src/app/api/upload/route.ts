import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/** Whitelist of allowed file extensions to prevent malicious uploads */
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

/**
 * When BLOB_READ_WRITE_TOKEN is set (Vercel production / preview) we upload to
 * Vercel Blob Storage.  Otherwise we fall back to the local filesystem so
 * development works without any external service.
 */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(request: NextRequest) {
  // Authenticate user
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 },
      );
    }

    // Generate unique filename with sanitized extension
    const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : "png";
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `avatars/${session.user.id}-${hash}.${ext}`;

    let url: string;

    if (useBlob) {
      // ── Vercel Blob Storage (production) ──────────────────────────
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });
      url = blob.url;
    } else {
      // ── Local filesystem (development) ────────────────────────────
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
      );
      await mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const localFilename = `${session.user.id}-${hash}.${ext}`;
      await writeFile(path.join(uploadDir, localFilename), buffer);
      url = `/uploads/avatars/${localFilename}`;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
