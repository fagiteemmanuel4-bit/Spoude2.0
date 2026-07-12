import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Permanently deletes the calling user's account: their Firebase Auth
 * record, their profile document, their library items, and their
 * uploaded files in Storage. This is irreversible — the client must
 * have already shown a confirmation step before calling this.
 */
export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  const uid = request.auth.uid;
  const db = getFirestore();
  const storage = getStorage();

  // Delete the user's library/material documents first, and any files
  // they point to in Storage.
  const materialsSnap = await db.collection("materials").where("user_id", "==", uid).get();
  const bucket = storage.bucket();
  await Promise.all(
    materialsSnap.docs.map(async (doc) => {
      const path = doc.data().storage_path as string | undefined;
      if (path) {
        await bucket
          .file(path)
          .delete()
          .catch(() => {
            /* file may already be gone — not fatal */
          });
      }
      await doc.ref.delete();
    }),
  );

  // Delete study sets, verification code doc, and profile.
  const setsSnap = await db.collection("study_sets").where("user_id", "==", uid).get();
  await Promise.all(setsSnap.docs.map((doc) => doc.ref.delete()));

  await db
    .collection("verification_codes")
    .doc(uid)
    .delete()
    .catch(() => {});
  await db
    .collection("profiles")
    .doc(uid)
    .delete()
    .catch(() => {});

  // Finally, delete the actual auth account.
  await getAuth().deleteUser(uid);

  return { deleted: true };
});
