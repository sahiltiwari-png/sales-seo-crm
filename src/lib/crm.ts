export type StudioSection = "overview" | "leads" | "contacts" | "bookings" | "tasks" | "seo" | "keywords" | "pages";

export type StudioRecordType = "lead" | "contact" | "booking" | "task" | "keyword" | "page";

export const salesRecordTypes: StudioRecordType[] = ["lead", "contact", "booking", "task"];
export const seoRecordTypes: StudioRecordType[] = ["task", "keyword", "page"];

export const sectionRecordType: Partial<Record<StudioSection, StudioRecordType>> = {
  leads: "lead",
  contacts: "contact",
  bookings: "booking",
  tasks: "task",
  keywords: "keyword",
  pages: "page",
};

export const typeLabels: Record<StudioRecordType, string> = {
  lead: "Lead",
  contact: "Contact",
  booking: "Booking",
  task: "Task",
  keyword: "Keyword",
  page: "Page",
};

export const statusOptions: Record<StudioRecordType, string[]> = {
  lead: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
  contact: ["Active", "Follow-up", "Inactive"],
  booking: ["Requested", "Confirmed", "Completed", "Cancelled"],
  task: ["To do", "In progress", "Done"],
  keyword: ["Tracking", "Needs attention", "Improving"],
  page: ["Optimized", "Review needed", "Technical issue"],
};

export function belongsInSection(type: StudioRecordType, section: StudioSection): boolean {
  if (section === "overview") return type === "lead" || type === "booking" || type === "task";
  if (section === "seo") return seoRecordTypes.includes(type);
  if (section === "tasks") return type === "task";
  return sectionRecordType[section] === type;
}

export function getLeadMetrics(records: Array<{ record_type: string; status: string; amount: number | null }>) {
  const leads = records.filter((record) => record.record_type === "lead");
  return {
    total: leads.length,
    open: leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length,
    won: leads.filter((lead) => lead.status === "Won").length,
    pipelineValue: leads.reduce((sum, lead) => sum + (lead.amount ?? 0), 0),
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}