import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("ref");
    const token = url.searchParams.get("t");

    if (!reference || !token) {
      return NextResponse.json(
        { ok: false, error: "missing_params" },
        { status: 400 }
      );
    }

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

    // ✅ Update last_used_at timestamp
    await prisma.tracking_tokens.update({
      where: { id: tokenRow.id },
      data: { last_used_at: new Date() },
    });

    // ✅ Fetch advertisement details + related history
    const ad = await prisma.advertisements.findUnique({
      where: { reference_number: reference },
      include: {
        ad_review_history: { orderBy: { attempt: "desc" }, take: 10 },
        ad_status_history: { orderBy: { updated_at: "desc" }, take: 10 },
        advertisers: true,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { ok: false, error: "ad_not_found" },
        { status: 404 }
      );
    }

    // ✅ Count total attempts from review history
    const attempts =
      ad.ad_review_history.length > 0
        ? Math.max(...ad.ad_review_history.map((r) => r.attempt))
        : 0;

    // ✅ Send clean JSON payload
    return NextResponse.json({
      ok: true,
      ad: {
        reference_number: ad.reference_number,
        status: ad.status,
        publish_date: ad.publish_date,
        created_at: ad.created_at,
        advertisement_text: ad.advertisement_text,
        attempts,
        review_history: ad.ad_review_history,
        status_history: ad.ad_status_history,
        advertiser: ad.advertisers
          ? { name: ad.advertisers.name, email: ad.advertisers.email }
          : null,
      },
    });
  } catch (err) {
    console.error("Tracking API Error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
