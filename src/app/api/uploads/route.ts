import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function signatureIsValid(extension: string, bytes: Uint8Array) {
  if (["zip", "docx", "pptx"].includes(extension)) return bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]);
  if (extension === "pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (extension === "png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (extension === "jpg" || extension === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

const uploadRateLimit = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;
  const timestamps = (uploadRateLimit.get(key) ?? []).filter((time) => now - time < windowMs);
  if (timestamps.length >= maxRequests) {
    uploadRateLimit.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  uploadRateLimit.set(key, timestamps);
  return false;
}
function safeFilename(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-100) || "upload";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Upload request origin was not accepted." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > 5_500_000) return NextResponse.json({ error: "The upload request is too large." }, { status: 413 });
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to upload a project file." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload request could not be read." }, { status: 400 });
  }
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (isRateLimited(user.id)) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  if (!(file instanceof File) || (kind !== "project" && kind !== "thumbnail")) return NextResponse.json({ error: "Choose a valid file." }, { status: 400 });

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const maxBytes = kind === "thumbnail" ? 5 * 1024 * 1024 : 4 * 1024 * 1024;
  const allowedForKind = kind === "thumbnail" ? ["png", "jpg", "jpeg"] : Object.keys(allowedTypes);
  if (!allowedForKind.includes(extension) || file.type !== allowedTypes[extension] || file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json({ error: kind === "thumbnail" ? "Use a PNG or JPG thumbnail up to 5 MB." : "Use a PDF, ZIP, DOCX, PPTX, PNG, or JPG file up to 4 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureIsValid(extension, bytes)) return NextResponse.json({ error: "The file content does not match its supported file type." }, { status: 415 });

  const path = `${user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error } = await supabase.storage.from("project-assets").upload(path, bytes, { contentType: allowedTypes[extension], upsert: false });
  if (error) return NextResponse.json({ error: "The file could not be stored. Check Supabase Storage setup and try again." }, { status: 400 });
  return NextResponse.json({ path }, { status: 201 });
}