//frontend\routes\app.academy.profile.tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/ui-primitives";
import { ProfileView } from "@/components/academy/profile-view";

export const Route = createFileRoute("/app/academy/profile")({
  head: () => ({
    meta: [
      { title: "Profil apprenant — Academy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcademyProfilePage,
});

function AcademyProfilePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <PageHeader
        eyebrow="Academy"
        title="Votre profil."
        description="Progression, accomplissements et révisions."
      />
      <ProfileView />
    </div>
  );
}