import { useCallback, useEffect, useMemo, useState } from "react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  Filter,
  Headphones,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  belongsInSection,
  formatCurrency,
  getLeadMetrics,
  salesRecordTypes,
  seoRecordTypes,
  statusOptions,
  typeLabels,
  type StudioRecordType,
  type StudioSection,
} from "@/lib/crm";

type StudioRecord = Tables<"studio_records">;
type FormValues = {
  title: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  amount: string;
  scheduledAt: string;
  url: string;
  keyword: string;
  notes: string;
  searchVolume: string;
  currentRank: string;
  targetKeyword: string;
};

const emptyForm: FormValues = {
  title: "",
  company: "",
  email: "",
  phone: "",
  status: "New",
  amount: "",
  scheduledAt: "",
  url: "",
  keyword: "",
  notes: "",
  searchVolume: "",
  currentRank: "",
  targetKeyword: "",
};

const navigation: Array<{ id: StudioSection; label: string; icon: typeof LayoutDashboard; group: "workspace" | "growth" }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "workspace" },
  { id: "leads", label: "Leads", icon: Megaphone, group: "workspace" },
  { id: "contacts", label: "Contacts", icon: UsersRound, group: "workspace" },
  { id: "bookings", label: "Studio bookings", icon: CalendarDays, group: "workspace" },
  { id: "tasks", label: "Tasks", icon: ClipboardList, group: "workspace" },
  { id: "seo", label: "SEO overview", icon: TrendingUp, group: "growth" },
  { id: "keywords", label: "Keywords", icon: Target, group: "growth" },
  { id: "pages", label: "Website pages", icon: FileText, group: "growth" },
];

const pageCopy: Record<StudioSection, { eyebrow: string; title: string; description: string; addLabel: string }> = {
  overview: { eyebrow: "YOUR STUDIO, AT A GLANCE", title: "Good to see you.", description: "Everything moving at The First Talk, in one place.", addLabel: "Add a record" },
  leads: { eyebrow: "SALES WORKSPACE", title: "Leads", description: "Keep every conversation moving toward the studio.", addLabel: "Add lead" },
  contacts: { eyebrow: "SALES WORKSPACE", title: "Contacts", description: "Your people, collaborators, and returning clients.", addLabel: "Add contact" },
  bookings: { eyebrow: "SALES WORKSPACE", title: "Studio bookings", description: "Coordinate guest visits, shoots, and production sessions.", addLabel: "Add booking" },
  tasks: { eyebrow: "YOUR DAILY WORK", title: "Tasks", description: "The next small steps behind every great story.", addLabel: "Add task" },
  seo: { eyebrow: "SEARCH WORKSPACE", title: "SEO overview", description: "Plan your search work across The First Talk website.", addLabel: "Add SEO task" },
  keywords: { eyebrow: "SEARCH WORKSPACE", title: "Keywords", description: "Build a clear, manually managed keyword watchlist.", addLabel: "Add keyword" },
  pages: { eyebrow: "SEARCH WORKSPACE", title: "Website pages", description: "Track on-page improvements and technical follow-ups.", addLabel: "Add page" },
};

const viewOptions: Record<StudioSection, StudioRecordType[]> = {
  overview: [], leads: ["lead"], contacts: ["contact"], bookings: ["booking"], tasks: ["task"],
  seo: ["keyword", "page", "task"], keywords: ["keyword"], pages: ["page"],
};

function getInitialValues(record?: StudioRecord | null): FormValues {
  if (!record) return { ...emptyForm };
  const extra = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
    ? record.metadata
    : {};
  return {
    title: record.title,
    company: record.company ?? "",
    email: record.email ?? "",
    phone: record.phone ?? "",
    status: record.status,
    amount: record.amount == null ? "" : String(record.amount),
    scheduledAt: record.scheduled_at ? record.scheduled_at.slice(0, 16) : "",
    url: record.url ?? "",
    keyword: record.keyword ?? "",
    notes: record.notes ?? "",
    searchVolume: typeof extra.search_volume === "number" ? String(extra.search_volume) : "",
    currentRank: typeof extra.current_rank === "number" ? String(extra.current_rank) : "",
    targetKeyword: typeof extra.target_keyword === "string" ? extra.target_keyword : "",
  };
}

function GoogleG() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] shrink-0">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function TheFirstTalkMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Headphones className="size-[21px]" strokeWidth={2.1} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-sidebar bg-accent" />
      </div>
      {!compact && <div className="min-w-0">
        <div className="truncate font-display text-[15px] font-bold leading-tight text-sidebar-foreground">THE FIRST TALK</div>
        <div className="mt-1 text-[10px] font-semibold uppercase leading-none text-sidebar-muted">Studio command center</div>
      </div>}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-[11px] font-bold text-foreground">{children}</label>;
}

function RecordEditor({
  open,
  onOpenChange,
  type,
  record,
  onSave,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: StudioRecordType;
  record: StudioRecord | null;
  onSave: (values: FormValues) => Promise<void>;
  busy: boolean;
}) {
  const [values, setValues] = useState<FormValues>(() => getInitialValues(record));

  useEffect(() => {
    if (open) setValues(getInitialValues(record));
  }, [open, record]);

  const setField = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const isSEO = type === "keyword" || type === "page";
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[600px]">
        <DialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-md bg-accent-soft text-accent-foreground">
            {isSEO ? <Target className="size-5" /> : type === "booking" ? <CalendarDays className="size-5" /> : <Plus className="size-5" />}
          </div>
          <DialogTitle className="font-display text-xl">{record ? `Edit ${typeLabels[type].toLowerCase()}` : `New ${typeLabels[type].toLowerCase()}`}</DialogTitle>
          <DialogDescription>{isSEO ? "Keep your own search research and follow-ups together." : "Add the details you need to keep this relationship moving."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 pt-1">
          <div>
            <FieldLabel>{type === "keyword" ? "Search keyword" : type === "page" ? "Page title" : type === "task" ? "Task" : "Name"}</FieldLabel>
            <Input required value={values.title} onChange={(event) => setField("title", event.target.value)} placeholder={type === "keyword" ? "e.g. podcast studio in Jabalpur" : type === "page" ? "e.g. Studio booking" : type === "task" ? "e.g. Follow up with the guest" : "Full name or clear title"} />
          </div>

          {(type === "lead" || type === "contact" || type === "booking") && <div className="grid gap-4 sm:grid-cols-2">
            <div><FieldLabel>Company or brand</FieldLabel><Input value={values.company} onChange={(event) => setField("company", event.target.value)} placeholder="Business name" /></div>
            <div><FieldLabel>Email</FieldLabel><Input type="email" value={values.email} onChange={(event) => setField("email", event.target.value)} placeholder="name@example.com" /></div>
            <div><FieldLabel>Phone</FieldLabel><Input type="tel" value={values.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="Phone number" /></div>
            {type === "lead" && <div><FieldLabel>Potential value (₹)</FieldLabel><Input min="0" type="number" value={values.amount} onChange={(event) => setField("amount", event.target.value)} placeholder="0" /></div>}
          </div>}

          {(type === "booking" || type === "task") && <div>
            <FieldLabel>{type === "booking" ? "Studio date and time" : "Due date and time"}</FieldLabel>
            <Input type="datetime-local" value={values.scheduledAt} onChange={(event) => setField("scheduledAt", event.target.value)} />
          </div>}

          {(type === "keyword" || type === "page") && <div className="grid gap-4 sm:grid-cols-2">
            <div><FieldLabel>{type === "keyword" ? "Tracked keyword" : "Target keyword"}</FieldLabel><Input value={type === "keyword" ? values.keyword : values.targetKeyword} onChange={(event) => setField(type === "keyword" ? "keyword" : "targetKeyword", event.target.value)} placeholder="Focus search phrase" /></div>
            <div><FieldLabel>{type === "keyword" ? "Current position" : "SEO status"}</FieldLabel>{type === "keyword" ? <Input min="1" type="number" value={values.currentRank} onChange={(event) => setField("currentRank", event.target.value)} placeholder="Not checked" /> : <span className="flex h-9 items-center text-sm text-muted-foreground">Choose below</span>}</div>
            <div><FieldLabel>{type === "keyword" ? "Searches / month" : "Page URL"}</FieldLabel>{type === "keyword" ? <Input min="0" type="number" value={values.searchVolume} onChange={(event) => setField("searchVolume", event.target.value)} placeholder="Not checked" /> : <Input type="url" value={values.url} onChange={(event) => setField("url", event.target.value)} placeholder="https://thefirsttalk.in/..." />}</div>
          </div>}

          {type === "task" && <div>
            <FieldLabel>Area</FieldLabel>
            <Select value={values.company || "Sales"} onValueChange={(value) => setField("company", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Sales">Sales</SelectItem><SelectItem value="SEO">SEO</SelectItem><SelectItem value="Studio">Studio</SelectItem></SelectContent>
            </Select>
          </div>}

          <div>
            <FieldLabel>Status</FieldLabel>
            <Select value={values.status} onValueChange={(value) => setField("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions[type].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div><FieldLabel>{isSEO ? "Notes and SEO actions" : "Notes"}</FieldLabel><textarea value={values.notes} onChange={(event) => setField("notes", event.target.value)} placeholder={isSEO ? "Add your research, page changes, or next SEO step…" : "Context, follow-up, or anything worth remembering…"} rows={3} className="crm-textarea" /></div>

          <DialogFooter className="gap-2 border-t border-border pt-4 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">{busy ? "Saving…" : record ? "Save changes" : `Save ${typeLabels[type].toLowerCase()}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
    } else if (isSignUp && !result.data.session) {
      setMessage("Check your inbox for a confirmation link, then sign in here.");
    } else if (isSignUp) {
      setMessage("Your workspace is ready.");
    }
  };

  const socialSignIn = async (provider: "google" | "lovable") => {
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) setError(result.error.message);
  };

  return (
    <main className="auth-scene">
      <div className="auth-frame">
        <div className="auth-brand-line"><TheFirstTalkMark /><span className="auth-edition"><span className="status-dot" /> PRIVATE WORKSPACE</span></div>
        <section className="auth-content">
          <div className="auth-overline"><span className="live-wave"><span /><span /><span /><span /></span> THE FIRST TALK · STUDIO HQ</div>
          <h1>{isSignUp ? <>Make room<br />for great work.</> : <>Every great story<br /><span>starts somewhere.</span></>}</h1>
          <p className="auth-intro">Your sales, studio schedule, and search workspace — ready for the next conversation.</p>
          <div className="auth-form-panel">
            <div className="flex items-start justify-between gap-3">
              <div><h2>{isSignUp ? "Create your workspace" : "Welcome back"}</h2><p>{isSignUp ? "Set up your private studio command center." : "Sign in to pick up where your team left off."}</p></div>
              <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-background text-primary"><ShieldCheck className="size-[19px]" /></div>
            </div>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div><FieldLabel>Email address</FieldLabel><div className="auth-input-wrap"><Mail /><Input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@yourstudio.com" /></div></div>
              <div><FieldLabel>Password</FieldLabel><Input required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></div>
              {error && <p role="alert" className="auth-error">{error}</p>}
              {message && <p role="status" className="auth-success"><Check className="size-4 shrink-0" />{message}</p>}
              <Button type="submit" disabled={busy} className="auth-submit w-full bg-primary text-primary-foreground hover:bg-primary/90">{busy ? "One moment…" : isSignUp ? "Create private workspace" : "Sign in to your workspace"}<ArrowUpRight className="size-4" /></Button>
            </form>
            <div className="auth-divider"><span /> OR CONTINUE WITH <span /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => void socialSignIn("google")} className="provider-google w-full"><GoogleG />Continue with Google</Button>
              <Button type="button" variant="outline" onClick={() => void socialSignIn("lovable")} className="provider-lovable w-full"><LovableMark className="size-[18px]" />Continue with Lovable</Button>
            </div>
            <p className="auth-switch">{isSignUp ? "Already have a workspace?" : "New to Studio HQ?"}<button type="button" onClick={() => { setIsSignUp((current) => !current); setMessage(""); setError(""); }}>{isSignUp ? "Sign in" : "Create an account"}</button></p>
          </div>
          <div className="auth-footnote"><ShieldCheck className="size-4" />Your sales and search records are private to your account.</div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, note, icon: Icon, tone = "yellow" }: { title: string; value: string; note: string; icon: typeof UsersRound; tone?: "yellow" | "red" | "green" }) {
  return <section className="stat-card">
    <div className="flex items-start justify-between"><span className="stat-label">{title}</span><span className={`stat-icon stat-icon-${tone}`}><Icon className="size-[18px]" /></span></div>
    <div className="mt-5 font-display text-[30px] font-bold leading-none text-foreground">{value}</div>
    <div className="mt-2 text-xs text-muted-foreground">{note}</div>
  </section>;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <Badge variant="outline" className={`status-pill status-${normalized}`}>{status}</Badge>;
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", ...(value.includes(":") ? { hour: "numeric", minute: "2-digit" } : {}) }).format(new Date(value));
}

export function CrmPanel() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authPending, setAuthPending] = useState(true);
  const [section, setSection] = useState<StudioSection>("overview");
  const [records, setRecords] = useState<StudioRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<StudioRecordType>("lead");
  const [editingRecord, setEditingRecord] = useState<StudioRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<StudioRecord | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") return;
      if (active) {
        setUser(session?.user ?? null);
        setAuthPending(false);
        if (event === "SIGNED_OUT") setRecords([]);
      }
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active) {
        setUser(error ? null : data.user);
        setAuthPending(false);
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoadingRecords(true);
    setRecordError("");
    const { data, error } = await supabase.from("studio_records").select("*").order("created_at", { ascending: false }).limit(500);
    setLoadingRecords(false);
    if (error) setRecordError(error.message);
    else setRecords(data ?? []);
  }, [user]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  const copy = pageCopy[section];
  const metrics = useMemo(() => getLeadMetrics(records), [records]);
  const sectionRecords = useMemo(() => {
    if (section === "overview") return records.filter((record) => belongsInSection(record.record_type as StudioRecordType, section));
    const allowedTypes = viewOptions[section];
    return records.filter((record) => allowedTypes.includes(record.record_type as StudioRecordType));
  }, [records, section]);
  const filteredRecords = useMemo(() => sectionRecords.filter((record) => {
    const searchable = [record.title, record.company, record.email, record.phone, record.url, record.keyword, record.notes].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(search.toLowerCase()) && (statusFilter === "all" || record.status === statusFilter);
  }), [search, sectionRecords, statusFilter]);
  const seoKeywords = records.filter((record) => record.record_type === "keyword");
  const seoPages = records.filter((record) => record.record_type === "page");
  const openTasks = records.filter((record) => record.record_type === "task" && record.status !== "Done");
  const uniqueStatuses = [...new Set(sectionRecords.map((record) => record.status))];
  const defaultTypeForSection = (target: StudioSection) => sectionRecordTypeForEditor(target);

  const openEditor = (type: StudioRecordType, record: StudioRecord | null = null) => {
    setEditorType(type);
    setEditingRecord(record);
    setEditorOpen(true);
    setNotice("");
  };

  const saveRecord = async (values: FormValues) => {
    if (!user) return;
    setSaving(true);
    setRecordError("");
    setNotice("");
    const isSEO = editorType === "keyword" || editorType === "page" || (editorType === "task" && values.company === "SEO");
    const payload: TablesInsert<"studio_records"> = {
      user_id: user.id,
      section: isSEO ? "seo" : "sales",
      record_type: editorType,
      title: values.title.trim(),
      company: editorType === "task" ? values.company : values.company.trim() || null,
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
      status: values.status,
      amount: editorType === "lead" && values.amount ? Number(values.amount) : null,
      scheduled_at: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
      url: editorType === "page" ? values.url.trim() || null : null,
      keyword: editorType === "keyword" ? values.keyword.trim() || values.title.trim() : editorType === "page" ? values.targetKeyword.trim() || null : null,
      notes: values.notes.trim() || null,
      metadata: {
        ...(editorType === "keyword" && values.searchVolume ? { search_volume: Number(values.searchVolume) } : {}),
        ...(editorType === "keyword" && values.currentRank ? { current_rank: Number(values.currentRank) } : {}),
      },
    };
    const query = editingRecord
      ? supabase.from("studio_records").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingRecord.id)
      : supabase.from("studio_records").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { setRecordError(error.message); return; }
    setEditorOpen(false);
    setNotice(editingRecord ? "Record updated." : `${typeLabels[editorType]} saved.`);
    await loadRecords();
  };

  const removeRecord = async () => {
    if (!deleteRecord) return;
    const { error } = await supabase.from("studio_records").delete().eq("id", deleteRecord.id);
    if (error) setRecordError(error.message);
    else {
      setRecords((current) => current.filter((record) => record.id !== deleteRecord.id));
      setNotice(`${typeLabels[deleteRecord.record_type as StudioRecordType]} removed.`);
    }
    setDeleteRecord(null);
  };

  const updateStatus = async (record: StudioRecord, status: string) => {
    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status } : item));
    const { error } = await supabase.from("studio_records").update({ status, updated_at: new Date().toISOString() }).eq("id", record.id);
    if (error) { setRecordError(error.message); void loadRecords(); }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setRecords([]);
  };

  if (authPending) return <main className="auth-loading"><span className="loading-ring" /><span className="sr-only">Loading your workspace</span></main>;
  if (!user) return <AuthScreen />;

  return (
    <div className="studio-shell">
      <aside className={`studio-sidebar ${mobileNavOpen ? "studio-sidebar-open" : ""}`}>
        <div className="sidebar-brand"><TheFirstTalkMark /><Button variant="ghost" size="icon" aria-label="Close navigation" className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}><X /></Button></div>
        <div className="workspace-picker"><div className="workspace-avatar">FT</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-sidebar-foreground">The First Talk</div><div className="mt-1 text-[10px] text-sidebar-muted">Studio workspace</div></div><ChevronDown className="size-4 text-sidebar-muted" /></div>
        <div className="sidebar-group-label">WORKSPACE</div>
        <nav aria-label="CRM sections" className="sidebar-nav">
          {navigation.filter((item) => item.group === "workspace").map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => { setSection(id); setMobileNavOpen(false); setStatusFilter("all"); }} className={`sidebar-link ${section === id ? "sidebar-link-active" : ""}`} aria-current={section === id ? "page" : undefined}><Icon className="size-[17px]" /><span>{label}</span>{id === "leads" && metrics.open > 0 && <span className="sidebar-count">{metrics.open}</span>}</button>)}
        </nav>
        <div className="sidebar-group-label sidebar-growth-label">GROWTH</div>
        <nav aria-label="SEO sections" className="sidebar-nav">
          {navigation.filter((item) => item.group === "growth").map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => { setSection(id); setMobileNavOpen(false); setStatusFilter("all"); }} className={`sidebar-link ${section === id ? "sidebar-link-active" : ""}`} aria-current={section === id ? "page" : undefined}><Icon className="size-[17px]" /><span>{label}</span></button>)}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-privacy"><span className="privacy-icon"><ShieldCheck className="size-[15px]" /></span><div><div className="text-[11px] font-semibold text-sidebar-foreground">Private workspace</div><div className="mt-1 text-[10px] text-sidebar-muted">Your data stays yours</div></div></div>
          <button type="button" onClick={() => void signOut()} className="sidebar-link sidebar-signout"><LogOut className="size-4" /><span>Sign out</span></button>
        </div>
      </aside>

      {mobileNavOpen && <button type="button" className="mobile-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <div className="studio-main">
        <header className="studio-topbar">
          <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><MoreHorizontal /></Button><div className="breadcrumb"><span>The First Talk</span><span className="breadcrumb-slash">/</span><strong>{copy.title}</strong></div></div>
          <div className="flex items-center gap-2 sm:gap-3"><div className="topbar-date">{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date())}</div><div className="topbar-divider" /><div className="user-chip"><span className="user-avatar">{(user.email?.[0] ?? "F").toUpperCase()}</span><span className="user-chip-email">{user.email}</span></div></div>
        </header>

        <main className="studio-content">
          <div className="page-heading">
            <div className="min-w-0"><div className="page-eyebrow"><span className="eyebrow-mark" />{copy.eyebrow}</div><h1 className="font-display">{copy.title}</h1><p>{copy.description}</p></div>
            {section !== "seo" && section !== "overview" && <Button onClick={() => openEditor(defaultTypeForSection(section))} className="add-record-button bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /><span>{copy.addLabel}</span></Button>}
            {section === "seo" && <Button onClick={() => openEditor("task")} className="add-record-button bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /><span>{copy.addLabel}</span></Button>}
          </div>

          {notice && <div role="status" className="notice-banner"><Check className="size-4 shrink-0" />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X className="size-4" /></button></div>}
          {recordError && <div role="alert" className="error-banner"><CircleHelp className="size-4 shrink-0" /><span>{recordError}</span><button type="button" aria-label="Dismiss error" onClick={() => setRecordError("")}><X className="size-4" /></button></div>}

          {section === "overview" && <Overview records={records} metrics={metrics} openTasks={openTasks} loading={loadingRecords} onOpenSection={setSection} onAdd={openEditor} onEdit={openEditor} />}
          {section === "seo" && <SeoOverview keywords={seoKeywords} pages={seoPages} tasks={openTasks.filter((task) => task.company === "SEO")} loading={loadingRecords} onOpenSection={setSection} onAdd={openEditor} onEdit={openEditor} />}
          {!(["overview", "seo"] as StudioSection[]).includes(section) && <RecordsView section={section} records={filteredRecords} allRecords={sectionRecords} loading={loadingRecords} search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={uniqueStatuses} onAdd={() => openEditor(defaultTypeForSection(section))} onEdit={(record) => openEditor(record.record_type as StudioRecordType, record)} onDelete={setDeleteRecord} onStatusChange={updateStatus} />}
        </main>
      </div>

      <RecordEditor key={`${editorType}-${editingRecord?.id ?? "new"}`} open={editorOpen} onOpenChange={setEditorOpen} type={editorType} record={editingRecord} onSave={saveRecord} busy={saving} />
      <Dialog open={Boolean(deleteRecord)} onOpenChange={(open) => { if (!open) setDeleteRecord(null); }}>
        <DialogContent className="border-border bg-card sm:max-w-[420px]"><DialogHeader><DialogTitle className="font-display">Remove this record?</DialogTitle><DialogDescription>This action can’t be undone. The record will be removed from your private workspace.</DialogDescription></DialogHeader><DialogFooter className="gap-2 sm:gap-2"><Button variant="outline" onClick={() => setDeleteRecord(null)}>Keep record</Button><Button variant="destructive" onClick={() => void removeRecord()}><Trash2 className="size-4" />Remove record</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function sectionRecordTypeForEditor(section: StudioSection): StudioRecordType {
  if (section === "overview" || section === "leads") return "lead";
  if (section === "contacts") return "contact";
  if (section === "bookings") return "booking";
  if (section === "tasks" || section === "seo") return "task";
  if (section === "keywords") return "keyword";
  return "page";
}

function Overview({ records, metrics, openTasks, loading, onOpenSection, onAdd, onEdit }: {
  records: StudioRecord[];
  metrics: ReturnType<typeof getLeadMetrics>;
  openTasks: StudioRecord[];
  loading: boolean;
  onOpenSection: (section: StudioSection) => void;
  onAdd: (type: StudioRecordType) => void;
  onEdit: (type: StudioRecordType, record: StudioRecord) => void;
}) {
  const bookings = records.filter((record) => record.record_type === "booking").slice(0, 4);
  const leads = records.filter((record) => record.record_type === "lead").slice(0, 5);
  const nextTask = openTasks[0];
  const recordCount = records.length;
  return <>
    <div className="welcome-strip"><div className="welcome-icon"><Activity className="size-5" /></div><div className="min-w-0 flex-1"><span className="welcome-kicker">ON AIR AT THE FIRST TALK</span><div className="welcome-copy">Good conversations make great things happen.</div><div className="welcome-subcopy">Start with a lead, book a session, or jot down your next step.</div></div><Button variant="outline" size="sm" onClick={() => onAdd("lead")} className="welcome-action"><Plus className="size-4" /><span>New lead</span></Button><div className="welcome-wave"><span /><span /><span /><span /><span /><span /><span /><span /></div></div>
    <div className="stats-grid">
      <StatCard title="OPEN LEADS" value={loading ? "—" : String(metrics.open)} note={`${metrics.total} total leads in your pipeline`} icon={UsersRound} />
      <StatCard title="PIPELINE VALUE" value={loading ? "—" : formatCurrency(metrics.pipelineValue)} note="Estimated from lead values you added" icon={TrendingUp} tone="green" />
      <StatCard title="UPCOMING BOOKINGS" value={loading ? "—" : String(records.filter((record) => record.record_type === "booking" && !["Completed", "Cancelled"].includes(record.status)).length)} note="Sessions to prepare for" icon={CalendarDays} tone="red" />
      <StatCard title="TO-DO TODAY" value={loading ? "—" : String(openTasks.length)} note="Tasks still in progress" icon={ClipboardList} />
    </div>
    <div className="content-grid content-grid-overview">
      <section className="panel-section"><PanelHeading title="Sales pipeline" subtitle="Recent leads and next conversations" action="View all" onAction={() => onOpenSection("leads")} /><div className="pipeline-strip"><PipelineStage label="New" count={records.filter((record) => record.record_type === "lead" && record.status === "New").length} tone="stage-yellow" /><span className="pipeline-arrow">›</span><PipelineStage label="Contacted" count={records.filter((record) => record.record_type === "lead" && record.status === "Contacted").length} tone="stage-blue" /><span className="pipeline-arrow">›</span><PipelineStage label="Qualified" count={records.filter((record) => record.record_type === "lead" && ["Qualified", "Proposal"].includes(record.status)).length} tone="stage-green" /><span className="pipeline-arrow">›</span><PipelineStage label="Won" count={metrics.won} tone="stage-red" /></div>
        {loading ? <LoadingRows /> : leads.length ? <div className="compact-list">{leads.map((lead) => <CompactRecord key={lead.id} record={lead} onEdit={onEdit} />)}</div> : <EmptyState title="Your pipeline starts here" description="Add your first lead to keep a new conversation on your radar." action="Add your first lead" onAction={() => onAdd("lead")} icon={Megaphone} />}
      </section>
      <section className="panel-section"><PanelHeading title="Studio schedule" subtitle="Upcoming guest sessions and shoots" action="View all" onAction={() => onOpenSection("bookings")} />{loading ? <LoadingRows /> : bookings.length ? <div className="compact-list">{bookings.map((booking) => <CompactRecord key={booking.id} record={booking} onEdit={onEdit} />)}</div> : <EmptyState title="No sessions booked yet" description="Keep guest visits and studio production in one clear schedule." action="Add a booking" onAction={() => onAdd("booking")} icon={CalendarDays} />}</section>
    </div>
    <div className="content-grid content-grid-lower">
      <section className="panel-section"><PanelHeading title="Next up" subtitle="Your open follow-ups" action="All tasks" onAction={() => onOpenSection("tasks")} />{loading ? <LoadingRows /> : openTasks.length ? <div className="task-preview">{openTasks.slice(0, 4).map((task) => <button key={task.id} type="button" onClick={() => onEdit("task", task)} className="task-preview-row"><span className={`task-check ${task.status === "In progress" ? "task-check-active" : ""}`}>{task.status === "In progress" && <Check className="size-3" />}</span><span className="min-w-0 flex-1 truncate text-left">{task.title}</span><span className="task-due">{task.scheduled_at ? formatDate(task.scheduled_at) : "No due date"}</span></button>)}</div> : <EmptyState title="A clear slate" description="Add a follow-up or production task when you’re ready." action="Add a task" onAction={() => onAdd("task")} icon={ClipboardList} />}</section>
      <section className="seo-promo"><div className="promo-icon"><Sparkles className="size-[18px]" /></div><span className="promo-eyebrow">A LITTLE MORE DISCOVERY</span><h2>Your voice deserves<br />to be found.</h2><p>Keep track of podcast searches and the pages you’re improving — all in one search workspace.</p><div className="promo-counts"><button type="button" onClick={() => onOpenSection("keywords")}><span>{records.filter((item) => item.record_type === "keyword").length}</span> tracked keywords</button><i /><button type="button" onClick={() => onOpenSection("pages")}><span>{records.filter((item) => item.record_type === "page").length}</span> website pages</button></div><Button variant="outline" size="sm" onClick={() => onOpenSection("seo")} className="promo-button">Open SEO workspace<ArrowUpRight className="size-4" /></Button><div className="promo-wave"><span /><span /><span /><span /><span /><span /><span /></div></section>
    </div>
    <div className="records-footnote"><ShieldCheck className="size-4" /><span>{recordCount === 0 ? "This is your private workspace. Nothing is shared until you add it." : `${recordCount} private ${recordCount === 1 ? "record" : "records"} in your workspace.`}</span><button type="button" onClick={() => onOpenSection("contacts")}>View contacts <ArrowUpRight className="size-3.5" /></button></div>
    {nextTask && <div className="sr-only">Next task: {nextTask.title}</div>}
  </>;
}

function SeoOverview({ keywords, pages, tasks, loading, onOpenSection, onAdd, onEdit }: {
  keywords: StudioRecord[];
  pages: StudioRecord[];
  tasks: StudioRecord[];
  loading: boolean;
  onOpenSection: (section: StudioSection) => void;
  onAdd: (type: StudioRecordType) => void;
  onEdit: (type: StudioRecordType, record: StudioRecord) => void;
}) {
  const needReview = pages.filter((page) => page.status === "Review needed" || page.status === "Technical issue").length;
  return <>
    <div className="seo-intro-band"><div className="seo-intro-icon"><TrendingUp className="size-5" /></div><div><div className="welcome-kicker">THE FIRST TALK · SEARCH</div><h2>Make every search lead to a story.</h2><p>Keep your keyword ideas, website pages, and SEO work organized — update when you have new research.</p></div><Button variant="outline" size="sm" onClick={() => onAdd("keyword")} className="welcome-action"><Plus className="size-4" /><span>Track a keyword</span></Button></div>
    <div className="stats-grid stats-grid-seo"><StatCard title="TRACKED KEYWORDS" value={loading ? "—" : String(keywords.length)} note="Keywords you are keeping an eye on" icon={Target} /><StatCard title="PAGES IN YOUR PLAN" value={loading ? "—" : String(pages.length)} note="Pages you’ve added to your SEO list" icon={FileText} tone="green" /><StatCard title="PAGES TO REVIEW" value={loading ? "—" : String(needReview)} note="Marked for an SEO follow-up" icon={CircleHelp} tone="red" /><StatCard title="OPEN SEO TASKS" value={loading ? "—" : String(tasks.length)} note="SEO tasks not yet marked done" icon={ClipboardList} /></div>
    <div className="content-grid content-grid-overview"><section className="panel-section"><PanelHeading title="Keyword watchlist" subtitle="Your own notes and search observations" action="All keywords" onAction={() => onOpenSection("keywords")} />{loading ? <LoadingRows /> : keywords.length ? <div className="compact-list">{keywords.slice(0, 5).map((keyword) => <CompactRecord key={keyword.id} record={keyword} onEdit={onEdit} />)}</div> : <EmptyState title="Start your keyword watchlist" description="Add search phrases relevant to your podcast guests, services, or production studio." action="Add a keyword" onAction={() => onAdd("keyword")} icon={Target} />}</section><section className="panel-section"><PanelHeading title="Pages to strengthen" subtitle="Website pages and their next SEO steps" action="All pages" onAction={() => onOpenSection("pages")} />{loading ? <LoadingRows /> : pages.length ? <div className="compact-list">{pages.slice(0, 5).map((page) => <CompactRecord key={page.id} record={page} onEdit={onEdit} />)}</div> : <EmptyState title="Add a website page" description="Track page titles, target searches, and improvements you want to make." action="Add a page" onAction={() => onAdd("page")} icon={FileText} />}</section></div>
    <section className="seo-next-strip"><div className="seo-next-icon"><Sparkles className="size-[18px]" /></div><div className="min-w-0 flex-1"><div className="font-display text-sm font-bold text-foreground">SEO stays in your hands</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">Rank positions and search volumes only show what you enter; connect a research source when you’re ready for live data.</div></div><Button variant="outline" size="sm" onClick={() => onAdd("task")}><Plus className="size-4" />Add SEO task</Button></section>
  </>;
}

function PipelineStage({ label, count, tone }: { label: string; count: number; tone: string }) {
  return <div className={`pipeline-stage ${tone}`}><span className="pipeline-stage-count">{count}</span><span>{label}</span></div>;
}

function PanelHeading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="panel-heading"><div className="min-w-0"><h2>{title}</h2><p>{subtitle}</p></div>{action && <button type="button" onClick={onAction} className="panel-link">{action}<ArrowUpRight className="size-3.5" /></button>}</div>;
}

function EmptyState({ title, description, action, onAction, icon: Icon }: { title: string; description: string; action: string; onAction: () => void; icon: typeof UsersRound }) {
  return <div className="empty-state"><span className="empty-icon"><Icon className="size-5" /></span><h3>{title}</h3><p>{description}</p><Button variant="outline" size="sm" onClick={onAction}><Plus className="size-4" />{action}</Button></div>;
}

function LoadingRows() {
  return <div className="loading-rows" aria-label="Loading records"><span /><span /><span /></div>;
}

function CompactRecord({ record, onEdit }: { record: StudioRecord; onEdit: (type: StudioRecordType, record: StudioRecord) => void }) {
  const recordType = record.record_type as StudioRecordType;
  const detail = record.company || record.keyword || (record.scheduled_at ? formatDate(record.scheduled_at) : record.url) || typeLabels[recordType];
  return <button type="button" onClick={() => onEdit(recordType, record)} className="compact-record"><span className="record-avatar" data-kind={recordType}>{typeIcon(recordType)}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-[13px] font-semibold text-foreground">{record.title}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{detail}</span></span><StatusPill status={record.status} /><ArrowUpRight className="compact-arrow size-4" /></button>;
}

function typeIcon(type: StudioRecordType) {
  const Icon = type === "lead" ? Megaphone : type === "contact" ? UsersRound : type === "booking" ? CalendarDays : type === "task" ? ClipboardList : type === "keyword" ? Target : FileText;
  return <Icon className="size-[17px]" />;
}

function RecordsView({ section, records, allRecords, loading, search, onSearchChange, statusFilter, onStatusChange, statuses, onAdd, onEdit, onDelete, onStatusChange: updateStatus }: {
  section: StudioSection;
  records: StudioRecord[];
  allRecords: StudioRecord[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statuses: string[];
  onAdd: () => void;
  onEdit: (record: StudioRecord) => void;
  onDelete: (record: StudioRecord) => void;
  onStatusChange: (record: StudioRecord, status: string) => void;
}) {
  const showSearchMeta = section === "keywords" || section === "pages";
  const recordType = sectionRecordTypeForEditor(section);
  const searchPlaceholder = section === "leads" ? "Search leads, companies, email…" : section === "contacts" ? "Search contacts, company, email…" : section === "bookings" ? "Search guests or bookings…" : section === "tasks" ? "Search tasks…" : section === "keywords" ? "Search keyword ideas…" : section === "pages" ? "Search page title or URL…" : "Search records…";
  return <>
    <div className="list-toolbar"><div className="list-toolbar-search"><Search className="size-4" /><Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} /></div><div className="list-toolbar-filter"><Filter className="size-4" /><Select value={statusFilter} onValueChange={onStatusChange}><SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div className="list-count">{records.length} {records.length === 1 ? "record" : "records"}</div></div>
    <section className="panel-section records-panel"><div className="records-table-head"><span>{showSearchMeta ? section === "keywords" ? "KEYWORD" : "PAGE" : section === "tasks" ? "TASK" : section === "bookings" ? "GUEST / SESSION" : "NAME"}</span><span>{section === "bookings" || section === "tasks" ? "DATE" : showSearchMeta ? section === "keywords" ? "CURRENT POSITION" : "TARGET KEYWORD" : "COMPANY"}</span><span>STATUS</span><span className="record-actions-heading">ACTIONS</span></div>
      {loading ? <LoadingRows /> : records.length ? <div className="records-table-body">{records.map((record) => {
        const currentType = record.record_type as StudioRecordType;
        const metadata = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? record.metadata : {};
        const secondValue = section === "bookings" || section === "tasks" ? formatDate(record.scheduled_at) : section === "keywords" ? typeof metadata.current_rank === "number" ? `#${metadata.current_rank}` : "Not checked" : section === "pages" ? record.keyword || "No target keyword" : record.company || "—";
        return <div className="record-row" key={record.id}><button type="button" onClick={() => onEdit(record)} className="record-primary"><span className="record-avatar" data-kind={currentType}>{typeIcon(currentType)}</span><span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-foreground">{record.title}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{showSearchMeta ? section === "keywords" ? `${typeof metadata.search_volume === "number" ? `${metadata.search_volume.toLocaleString()} searches / month` : "Volume not entered"} · Added ${formatDate(record.created_at)}` : record.url || "No URL added" : record.email || record.phone || typeLabels[currentType]}</span></span></button><span className="record-company truncate">{secondValue}</span><div className="record-status"><Select value={record.status} onValueChange={(status) => updateStatus(record, status)}><SelectTrigger aria-label={`Status for ${record.title}`} className="status-select"><SelectValue /></SelectTrigger><SelectContent>{statusOptions[currentType].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div className="record-actions"><Button variant="ghost" size="icon" aria-label={`Edit ${record.title}`} title="Edit record" onClick={() => onEdit(record)}><Settings2 className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${record.title}`} title="Remove record" className="delete-action" onClick={() => onDelete(record)}><Trash2 className="size-4" /></Button></div></div>;
      })}</div> : search || statusFilter !== "all" ? <EmptyState title="No matching records" description="Try another search or status, or clear the filters." action="Clear filters" onAction={() => { onSearchChange(""); onStatusChange("all"); }} icon={Search} /> : <EmptyState title={emptyListTitle(section)} description={emptyListDescription(section)} action={`Add ${typeLabels[recordType].toLowerCase()}`} onAction={onAdd} icon={typeIconComponent(recordType)} />}
      {!!allRecords.length && !loading && <div className="records-table-footer"><span>Showing {records.length} of {allRecords.length}</span><span><ShieldCheck className="size-3.5" /> Private to your account</span></div>}
    </section>
    <div className="records-footnote"><ShieldCheck className="size-4" /><span>Your records are private to your account. Add or update them as your studio grows.</span><span className="ml-auto">{records.length} total</span></div>
  </>;
}

function typeIconComponent(type: StudioRecordType) {
  return type === "lead" ? Megaphone : type === "contact" ? UsersRound : type === "booking" ? CalendarDays : type === "task" ? ClipboardList : type === "keyword" ? Target : FileText;
}

function emptyListTitle(section: StudioSection) {
  const titles: Partial<Record<StudioSection, string>> = {
    leads: "Start with your first conversation", contacts: "Your contact list is ready", bookings: "Make space for the next story", tasks: "What’s on your list?", keywords: "Build your keyword watchlist", pages: "Add a website page to your plan",
  };
  return titles[section] ?? "Nothing here yet";
}

function emptyListDescription(section: StudioSection) {
  const descriptions: Partial<Record<StudioSection, string>> = {
    leads: "Keep potential podcast guests, production enquiries, and partnerships in one pipeline.", contacts: "Keep guests, clients, and collaborators close at hand.", bookings: "Track guest visits, shoots, and studio production sessions.", tasks: "Keep the follow-ups and little production steps from slipping by.", keywords: "Manually track the search phrases relevant to your work and audience.", pages: "Add pages you’re improving and note the changes you want to make.",
  };
  return descriptions[section] ?? "Add a record to get started.";
}