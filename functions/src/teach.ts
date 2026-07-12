import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { styleById } from "./teaching-styles.js";

type Body = {
  materialId?: unknown;
  styleId?: unknown;
  page?: unknown;
  previousSummary?: unknown;
};

export const teach = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    res.status(401).send("Unauthorized");
    return;
  }
  const token = authHeader.replace(/Bearer /i, "").trim();
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    res.status(500).send("Server not configured");
    return;
  }

  const adminAuth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  let userId: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    res.status(401).send("Unauthorized");
    return;
  }

  const body = req.body as Body;
  const materialId = typeof body.materialId === "string" ? body.materialId : null;
  const styleIdRaw = typeof body.styleId === "string" ? body.styleId : null;
  if (!materialId) {
    res.status(400).send("materialId required");
    return;
  }
  const page =
    typeof body.page === "number" && body.page > 0 ? Math.min(20, Math.floor(body.page)) : 1;
  const previousSummary =
    typeof body.previousSummary === "string" ? body.previousSummary.slice(0, 4000) : "";

  const matSnap = await db.collection("materials").doc(materialId).get();
  if (!matSnap.exists) {
    res.status(404).send("Not found");
    return;
  }
  const mat = matSnap.data()!;

  let buf: Buffer;
  try {
    const fileRef = storage.bucket().file(mat.storage_path);
    const [downloaded] = await fileRef.download();
    buf = downloaded;
  } catch {
    res.status(500).send("Cannot read file");
    return;
  }

  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)) as number[]);
  }
  const dataUrl = `data:${mat.mime_type || "application/pdf"};base64,${Buffer.from(bin, "binary").toString("base64")}`;

  const style = styleById(styleIdRaw);
  const firstPageMsg = `Teach me everything I need to understand the attached material titled "${mat.title}"${mat.subject ? ` (${mat.subject})` : ""}. Treat me as a complete beginner.

This is **Page 1** of a multi-page lesson. Cover the foundational concepts a beginner needs first. Keep it focused (~500–800 words). End with a one-line teaser like "*Next up: …*" hinting at what page 2 will cover deeper. Do NOT try to fit everything into this page — leave room to go deeper on later pages. Follow the style and formatting rules in your instructions.`;

  const nextPageMsg = `Continue teaching the attached material titled "${mat.title}"${mat.subject ? ` (${mat.subject})` : ""}. This is **Page ${page}** of a progressive lesson.

Here is a compact summary of what has already been covered on earlier pages:
"""
${previousSummary || "(nothing yet)"}
"""

Now go DEEPER. Do not repeat what was already covered — build on it. Introduce the next layer of concepts, edge cases, worked examples, formulas, or nuances that a student should learn AFTER the previous page. Aim for ~500–800 words. End with a one-line teaser hinting at what page ${page + 1} will explore, unless the topic is fully exhausted (in which case end with "> **Lesson complete.**" instead).`;

  const userMsg = page === 1 ? firstPageMsg : nextPageMsg;

  // Log usage (fire-and-forget)
  void db.collection("ai_usage").add({
    user_id: userId,
    kind: "study",
    created_at: new Date().toISOString(),
  });

  const gwRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      stream: true,
      messages: [
        { role: "system", content: style.system },
        {
          role: "user",
          content: [
            { type: "text", text: userMsg },
            { type: "file", file: { filename: mat.file_name, file_data: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!gwRes.ok || !gwRes.body) {
    const text = await gwRes.text().catch(() => "");
    const status = gwRes.status === 402 ? 402 : gwRes.status === 429 ? 429 : 500;
    res.status(status).send(text.slice(0, 500) || "Tutor unavailable");
    return;
  }

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "no-store");
  res.set("X-Accel-Buffering", "no");

  const reader = gwRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) res.write(delta);
        } catch {
          /* ignore */
        }
      }
    }
  } finally {
    res.end();
  }
});
