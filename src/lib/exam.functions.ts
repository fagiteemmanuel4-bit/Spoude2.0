import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { PlanId } from "./plans";

type GenerateExamInput = { materialId: string; count: number };
type GenerateExamResult = { id: string; title: string; count: number; time_limit_minutes: number };
type UsageResult = { plan: PlanId; used: number; limit: number; remaining: number };

const _generateExamFromMaterial = httpsCallable<GenerateExamInput, GenerateExamResult>(
  functions,
  "generateExamFromMaterial",
);
const _getUsage = httpsCallable<Record<string, never>, UsageResult>(functions, "getUsage");

// These keep the same names/shapes as the old TanStack server functions
// so existing components that call generateExamFromMaterial(...)/getUsage()
// need little to no change — they now go through Firebase Callable
// Functions instead of a co-located server function.
export async function generateExamFromMaterial(input: GenerateExamInput): Promise<GenerateExamResult> {
  const res = await _generateExamFromMaterial(input);
  return res.data;
}

export async function getUsage(): Promise<UsageResult> {
  const res = await _getUsage({});
  return res.data;
}
