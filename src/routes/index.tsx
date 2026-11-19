import { createFileRoute } from "@tanstack/react-router";
import { CrmPanel } from "@/components/crm-panel";

export const Route = createFileRoute("/")({
  component: CrmPanel,
  head: () => ({
    meta: [
      { title: "The First Talk Studio HQ | Private CRM" },
      { name: "description", content: "A private sales, studio bookings, and SEO workspace for The First Talk." },
      { property: "og:title", content: "The First Talk Studio HQ" },
      { property: "og:description", content: "A private sales, studio bookings, and SEO workspace for The First Talk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
