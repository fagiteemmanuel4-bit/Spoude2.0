import { createFileRoute } from "@tanstack/react-router";
import { SetsManager } from "@/components/SetsManager";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study — Lumio" }] }),
  component: () => <SetsManager kind="study" />,
});
