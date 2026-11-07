
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await query<{
      database: string;
      username: string;
      product_count: number;
    }>(`
      SELECT
        current_database() AS database,
        current_user AS username,
        (SELECT COUNT(*)::int FROM public.products) AS product_count
    `);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
