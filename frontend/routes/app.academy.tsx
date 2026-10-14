import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AcademyProvider } from "../../academy/src/components/academy/academy-shell";
import "../../academy/src/components/academy/academy.css";

export const Route = createFileRoute("/app/academy")({
  head: () => ({
    meta: [
      { title: "Académie — Lead Cortex" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcademyLayout,
});

function AcademyLayout() {
  return (
    <AcademyProvider>
      <div className="academy-scope">
        <Outlet />
      </div>
    </AcademyProvider>
  );
}