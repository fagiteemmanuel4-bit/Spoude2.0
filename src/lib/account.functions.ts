import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

type Purpose = "signup" | "reset_password" | "change_password";

const _sendVerificationCode = httpsCallable<
  { purpose: Purpose; email?: string },
  { sent: boolean }
>(functions, "sendVerificationCode");

const _verifyCode = httpsCallable<
  { purpose: Purpose; code: string; email?: string },
  { verified: boolean; customToken?: string }
>(functions, "verifyCode");

const _deleteAccount = httpsCallable<Record<string, never>, { deleted: boolean }>(
  functions,
  "deleteAccount",
);

export async function sendVerificationCode(purpose: Purpose, email?: string) {
  const res = await _sendVerificationCode({ purpose, email });
  return res.data;
}

export async function verifyCode(purpose: Purpose, code: string, email?: string) {
  const res = await _verifyCode({ purpose, code, email });
  return res.data;
}

export async function deleteAccount() {
  const res = await _deleteAccount({});
  return res.data;
}
