import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ----------------------------------------
   GET single newspaper (for edit modal)
   GET /api/newspapers/[id]
---------------------------------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ MUST await

    if (!id) {
      return NextResponse.json(
        { message: "Missing newspaper id" },
        { status: 400 }
      );
    }

    const newspaper = await prisma.newspapers.findUnique({
      where: { id },
      include: {
        ad_types: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!newspaper) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(newspaper);
  } catch (error: any) {
    console.error("GET /newspapers/[id] error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch newspaper",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}

/* ----------------------------------------
   UPDATE newspaper (EDIT)
   PUT /api/newspapers/[id]
---------------------------------------- */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const {
      name,
      type,
      no_col_per_page,
      col_width,
      col_height,
      min_ad_height,
      tint_additional_charge,
      newspaper_img,
      ad_types = [],
    } = body;

    const existing = await prisma.newspapers.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Update newspaper core data
      const updatedNewspaper = await tx.newspapers.update({
        where: { id },
        data: {
          name,
          type,
          no_col_per_page,
          col_width,
          col_height,
          min_ad_height,
          tint_additional_charge,
          newspaper_img,
        },
      });

      // 2️⃣ Replace ad types
      if (Array.isArray(ad_types)) {
        await tx.ad_types.deleteMany({ where: { newspaper_id: id } });

        if (ad_types.length > 0) {
          await tx.ad_types.createMany({
            data: ad_types.map((ad: any) => ({
              newspaper_id: id,
              key: ad.key,
              name: ad.name,
              base_type: ad.base_type,
              count_first_words: ad.count_first_words,
              base_price: ad.base_price,
              additional_word_price: ad.additional_word_price,
              tint_color_price: ad.tint_color_price,
              is_allow_combined: ad.is_allow_combined,
              max_words: ad.max_words,
              img_url: ad.img_url ?? null,
              is_upload_image: ad.is_upload_image,
              extra_notes1: ad.extra_notes1 ?? null,
              extra_notes2: ad.extra_notes2 ?? null,
              priority_price: ad.priority_price ?? null,
            })),
          });
        }
      }

      return updatedNewspaper;
    });

    return NextResponse.json({
      message: "Newspaper updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("PUT /newspapers/[id] error:", error);

    return NextResponse.json(
      {
        message: "Failed to update newspaper",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}

/* ----------------------------------------
   DELETE newspaper
   DELETE /api/newspapers/[id]
---------------------------------------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.newspapers.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 }
      );
    }

    await prisma.newspapers.delete({ where: { id } });

    return NextResponse.json({ message: "Newspaper deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /newspapers/[id] error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete newspaper",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
