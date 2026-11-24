// frontend/components/leadex-ia/leadex-types.ts

export type LeadexCategory =
  | "import"
  | "leads"
  | "companies"
  | "enrichment"
  | "scoring"
  | "sequences"
  | "emails"
  | "export"
  | "cleanup";

export type LeadexRisk = "safe" | "moderate" | "destructive";
export type LeadexCost = "low" | "medium" | "high";

export type LeadexInput =
  | { type: "text"; key: string; label: string; placeholder?: string; required?: boolean }
  | {
      type: "number";
      key: string;
      label: string;
      min?: number;
      max?: number;
      placeholder?: string;
      required?: boolean;
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
    }
  | {
      type: "file";
      key: string;
      label: string;
      accept?: string;
      required?: boolean;
    };

export type LeadexAction = {
  id: string;
  category: LeadexCategory;
  label: string;
  description: string;
  risk: LeadexRisk;
  cost: LeadexCost;
  estimatedDuration: string;
  inputs: LeadexInput[];
  examples: string[];
};

export type LeadexJobStatus = "pending" | "running" | "done" | "error" | "cancelled";

export type LeadexJobStep = {
  id: string;
  label: string;
  status: LeadexJobStatus;
  detail?: string;
  startedAt?: number;
  finishedAt?: number;
};

export type LeadexJob = {
  id: string;
  actionId: string;
  actionLabel: string;
  status: LeadexJobStatus;
  progress: number;
  total: number;
  startedAt: number;
  finishedAt?: number;
  error?: string;
  steps: LeadexJobStep[];
};

export type LeadexAttachment = {
  id: string;
  name: string;
  size: number;
  kind: "image" | "document" | "context" | "csv";
  url?: string;
};

export type LeadexMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  createdAt: number;
  attachments?: LeadexAttachment[];
  actionId?: string;
  jobId?: string;
  pending?: boolean;
};

export type LeadexDraft = {
  actionId: string | null;
  values: Record<string, string | number | File | null>;
};
