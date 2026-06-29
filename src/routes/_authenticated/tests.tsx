import { createFileRoute } from "@tanstack/react-router";
import { SetsManager } from "@/components/SetsManager";

export const Route = createFileRoute("/_authenticated/tests")({
  head: () => ({ meta: [{ title: "Tests — Lumio" }] }),
  component: () => <SetsManager kind="test" />,
});
