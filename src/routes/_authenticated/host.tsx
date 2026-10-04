import { createFileRoute } from "@tanstack/react-router";
import { AdminTournaments } from "./admin.tournaments";

export const Route = createFileRoute("/_authenticated/host")({
  head: () => ({
    meta: [
      { title: "Host Dashboard | FireZone" },
      { name: "description", content: "Create your own Free Fire tournaments, publish room details and upload results." },
      { property: "og:title", content: "Host Dashboard | FireZone" },
      { property: "og:description", content: "Tournament hosting tools for approved hosts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AdminTournaments host />,
});
