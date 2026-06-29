import { createFileRoute } from "@tanstack/react-router";
import { SetsManager } from "@/components/SetsManager";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Exams — Lumio" }] }),
  component: () => <SetsManager kind="exam" />,
});
