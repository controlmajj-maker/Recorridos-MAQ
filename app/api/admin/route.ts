import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { del } from "@vercel/blob";

export async function DELETE() {
  try {
    // Recuperar todas las fotos antes de borrar los registros
    const photosResult = await pool.query(
      "SELECT photo_url, closure_photo_url FROM findings"
    );
    const photoUrls: string[] = photosResult.rows
      .flatMap((r: any) => [r.photo_url, r.closure_photo_url])
      .filter(Boolean);

    // Borrar registros de DB
    await pool.query("DELETE FROM findings");
    await pool.query("DELETE FROM inspections WHERE title != '__cfg__'");

    // Borrar todas las fotos del blob (tolerante a errores individuales)
    await Promise.allSettled(photoUrls.map(url => del(url)));

    return NextResponse.json({ success: true, deletedPhotos: photoUrls.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
