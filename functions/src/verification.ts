import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = () => getFirestore();

const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendCodeEmail(toEmail: string, toName: string, code: string, purpose: string) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !privateKey || !publicKey) {
    throw new HttpsError("internal", "Email service is not configured");
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: toEmail,
        to_name: toName || toEmail,
        code,
        purpose,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpsError("internal", `Failed to send email: ${text.slice(0, 200)}`);
  }
}

/**
 * Sends a 6-digit verification code for one of: "signup" | "reset_password" | "change_password".
 * For signup/change_password, caller must already be authenticated. For reset_password,
 * caller is NOT authenticated yet (they're locked out) — we look up the user by email instead.
 */
export const sendVerificationCode = onCall(async (request) => {
  const purpose = request.data?.purpose as string;
  if (!["signup", "reset_password", "change_password"].includes(purpose)) {
    throw new HttpsError("invalid-argument", "Invalid purpose");
  }

  let email: string;
  let uid: string | null = null;
  let name = "";

  if (purpose === "reset_password") {
    email = (request.data?.email as string) ?? "";
    if (!email) throw new HttpsError("invalid-argument", "Email required");
    // Don't reveal whether the account exists — always report success,
    // but only actually send if the account is real.
    try {
      const userRecord = await getAuth().getUserByEmail(email);
      uid = userRecord.uid;
      name = userRecord.displayName ?? "";
    } catch {
      return { sent: true };
    }
  } else {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
    uid = request.auth.uid;
    const userRecord = await getAuth().getUser(uid);
    email = userRecord.email ?? "";
    name = userRecord.displayName ?? "";
    if (!email) throw new HttpsError("failed-precondition", "No email on this account");
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_TTL_MINUTES * 60 * 1000;

  await db()
    .collection("verification_codes")
    .doc(uid!)
    .set({ code, purpose, email, expiresAt, used: false, createdAt: Date.now() });

  const purposeLabel =
    purpose === "signup"
      ? "verify your new Spoude account"
      : purpose === "reset_password"
        ? "reset your Spoude password"
        : "confirm changing your Spoude password";

  await sendCodeEmail(email, name, code, purposeLabel);

  return { sent: true };
});

export const verifyCode = onCall(async (request) => {
  const purpose = request.data?.purpose as string;
  const code = String(request.data?.code ?? "");
  let uid = request.data?.uid as string | undefined;

  if (purpose === "reset_password") {
    const email = request.data?.email as string;
    if (!email) throw new HttpsError("invalid-argument", "Email required");
    try {
      uid = (await getAuth().getUserByEmail(email)).uid;
    } catch {
      throw new HttpsError("invalid-argument", "Invalid or expired code");
    }
  } else {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
    uid = request.auth.uid;
  }

  if (!uid) throw new HttpsError("invalid-argument", "Missing user reference");

  const docRef = db().collection("verification_codes").doc(uid);
  const snap = await docRef.get();
  const data = snap.data();

  if (
    !data ||
    data.purpose !== purpose ||
    data.used ||
    data.expiresAt < Date.now() ||
    data.code !== code
  ) {
    throw new HttpsError("invalid-argument", "Invalid or expired code");
  }

  await docRef.update({ used: true });

  // For password reset specifically, also hand back a short-lived Firebase
  // custom token so the client can complete the reset without knowing the
  // old password.
  if (purpose === "reset_password") {
    const customToken = await getAuth().createCustomToken(uid);
    return { verified: true, customToken };
  }

  return { verified: true };
});
