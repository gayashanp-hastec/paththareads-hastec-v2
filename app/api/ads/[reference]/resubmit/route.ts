// app/api/ads/[reference]/resubmit/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ reference: string }> }
) {
  // ✅ await params because in Next.js 14.2+ params is now a Promise
  const { reference } = await context.params;

  try {
    const { token, newText } = await req.json();

    if (!token || !newText) {
      return NextResponse.json(
        { ok: false, error: "missing_parameters" },
        { status: 400 }
      );
    }

    // Verify tracking token
    const tokenHash = hashToken(token);
    const tokenRow = await prisma.tracking_tokens.findFirst({
      where: { reference, token_hash: tokenHash, revoked: false },
    });

    if (!tokenRow) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 403 }
      );
    }

    if (tokenRow.expires_at < new Date()) {
      return NextResponse.json(
        { ok: false, error: "expired_token" },
        { status: 403 }
      );
    }

    // Fetch the ad and its review history
    const ad = await prisma.advertisements.findUnique({
      where: { reference_number: reference },
      include: { ad_review_history: true },
    });

    if (!ad) {
      return NextResponse.json(
        { ok: false, error: "ad_not_found" },
        { status: 404 }
      );
    }

    // Compute the next review attempt number
    const nextAttempt =
      (ad.ad_review_history.length
        ? Math.max(...ad.ad_review_history.map((r) => r.attempt))
        : 0) + 1;

    // ✅ Perform updates as a transaction
    await prisma.$transaction([
      prisma.advertisements.update({
        where: { reference_number: reference },
        data: {
          advertisement_text: newText,
          status: "Resubmitted",
          updated_at: new Date(),
        },
      }),
      prisma.ad_review_history.create({
        data: {
          reference_number: reference,
          attempt: nextAttempt,
          advertisement_text: newText,
          requested_revision_text: null,
          status_now: "Resubmitted",
        },
      }),
      prisma.ad_status_history.create({
        data: {
          reference_number: reference,
          status: "Resubmitted",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error in resubmit route:", err);
    return NextResponse.json(
      { ok: false, error: "internal_server_error" },
      { status: 500 }
    );
  }
}
