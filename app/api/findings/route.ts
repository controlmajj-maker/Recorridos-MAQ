import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { del } from "@vercel/blob";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inspection_id = searchParams.get("inspection_id");
    let result;
    if (inspection_id) {
      result = await pool.query(
        "SELECT * FROM findings WHERE inspection_id = $1 ORDER BY created_at DESC",
        [inspection_id]
      );
    } else {
      // Return ALL findings (for loading active issues across all inspections)
        "SELECT * FROM findings ORDER BY created_at DESC"
    }
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req: Request) {
    const body = await req.json();
    const result = await pool.query(
      `INSERT INTO findings (inspection_id, zone_id, zone_name, item_label, description, severity, photo_url, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        body.inspection_id,
        body.zone_id || null,
        body.zone_name || null,
        body.item_label,
        body.description,
        body.severity || "medium",
        body.photo_url || null,
        body.ai_analysis || null,
      ]
    );
    return NextResponse.json(result.rows[0]);
export async function PUT(req: Request) {
    // Ensure column exists (safe to run every time — no-op if already present)
    await pool.query(`
      ALTER TABLE findings ADD COLUMN IF NOT EXISTS closure_photo_url TEXT
    `);
      `UPDATE findings 
       SET is_closed = true, corrective_actions = $1, closed_at = NOW(), closure_photo_url = COALESCE($2, closure_photo_url)
       WHERE id = $3 RETURNING *`,
      [body.corrective_actions, body.closure_photo_url || null, body.id]
// PATCH: edit finding fields (description, item_label)
export async function PATCH(req: Request) {
      `UPDATE findings SET description = COALESCE($1, description), item_label = COALESCE($2, item_label) WHERE id = $3 RETURNING *`,
      [body.description ?? null, body.item_label ?? null, body.id]
// DELETE: remove a finding and its Blob photo if present
export async function DELETE(req: Request) {
    const { id } = await req.json();
    // Fetch needed fields before deleting
    const row = await pool.query("SELECT photo_url, inspection_id, zone_id FROM findings WHERE id = $1", [id]);
    const photoUrl: string | null = row.rows[0]?.photo_url ?? null;
    const inspectionId: string | null = row.rows[0]?.inspection_id ?? null;
    const zoneId: string | null = row.rows[0]?.zone_id ?? null;
    // Delete from DB
    await pool.query("DELETE FROM findings WHERE id = $1", [id]);
    // Delete from Vercel Blob — silently ignore errors
    if (photoUrl) {
      try { await del(photoUrl); } catch { /* blob may not exist */ }
    return NextResponse.json({ success: true, inspection_id: inspectionId, zone_id: zoneId });
