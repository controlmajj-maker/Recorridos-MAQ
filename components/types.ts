// ─── Types ───────────────────────────────────────────────────────────────────
export type ZoneStatus = "PENDING" | "OK" | "ISSUE";
export type Severity = "low" | "medium" | "high";

export interface ChecklistItem { id: string; label: string; }
export interface ChecklistGroup { id: string; title: string; items: ChecklistItem[]; }

export interface Finding {
  id: string;
  inspection_id: string;
  zone_id?: string;
  zone_name?: string;
  item_id?: string;
  item_label: string;
  description: string;
  photo_url?: string;
  severity: Severity;
  ai_analysis?: string;
  is_closed: boolean;
  corrective_actions?: string;
  closure_photo_url?: string;
  closed_at?: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  status: ZoneStatus;
  x: number; y: number; width: number; height: number;
  checklistResults?: Record<string, boolean>;
  findings: Record<string, Finding>;
}

export interface Section {
  id: string;
  name: string;
  zoneIds: string[];
}

export interface Inspection {
  id: string;
  title: string;
  location: string;
  inspector: string;
  summary?: string;
  zones_data?: Zone[];
  created_at: string;
}
