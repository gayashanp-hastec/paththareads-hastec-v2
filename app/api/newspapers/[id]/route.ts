import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ----------------------------------------
   GET single newspaper
---------------------------------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Missing newspaper id" },
        { status: 400 },
      );
    }

    const newspaper = await prisma.newspapers.findUnique({
      where: { id },
      include: {
        ad_types: {
          orderBy: { id: "asc" },
          include: {
            ad_sections: {
              orderBy: { id: "asc" },
              include: {
                ad_section_sizes: { orderBy: { id: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!newspaper) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(newspaper);
  } catch (error: any) {
    console.error("GET /newspapers/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch newspaper" },
      { status: 500 },
    );
  }
}

/* ----------------------------------------
   UPDATE newspaper (SERVERLESS SAFE)
---------------------------------------- */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
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
      name_sinhala,
      is_lang_combine_allowed,
      combine_eng_price,
      combine_tam_price,
      combine_eng_tam_price,
      allowed_month_days = [],
      allowed_weekdays = [],
      ad_types = [],
    } = body;

    const existing = await prisma.newspapers.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 },
      );
    }

    const ops: any[] = [];

    /* ----------------------------------------
       1️⃣ Update newspaper core
    ---------------------------------------- */
    ops.push(
      prisma.newspapers.update({
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
          name_sinhala,
          is_lang_combine_allowed,
          combine_eng_price,
          combine_tam_price,
          combine_eng_tam_price,
          allowed_weekdays,
          allowed_month_days,
        },
      }),
    );

    /* ----------------------------------------
       2️⃣ Delete old ad data
    ---------------------------------------- */
    ops.push(
      prisma.ad_section_sizes.deleteMany({
        where: {
          ad_sections: {
            ad_types: {
              newspaper_id: id,
            },
          },
        },
      }),
    );

    ops.push(
      prisma.ad_sections.deleteMany({
        where: {
          ad_types: {
            newspaper_id: id,
          },
        },
      }),
    );

    ops.push(
      prisma.ad_types.deleteMany({
        where: { newspaper_id: id },
      }),
    );

    /* ----------------------------------------
       3️⃣ Re-create ad types + sections + sizes
    ---------------------------------------- */
    for (const ad of ad_types) {
      ops.push(
        prisma.ad_types.create({
          data: {
            newspaper_id: id,
            key: ad.key,
            name: ad.name,
            base_type: ad.base_type,
            count_first_words: Number(ad.count_first_words) || 0,
            base_price: Number(ad.base_price) || 0,
            additional_word_price: Number(ad.additional_word_price) || 0,
            tint_color_price: Number(ad.tint_color_price) || 0,
            is_allow_combined: Boolean(ad.is_allow_combined),
            max_words: Number.isFinite(ad.max_words) ? ad.max_words : 0,
            img_url: ad.img_url ?? null,
            is_upload_image: Boolean(ad.is_upload_image),
            extra_notes1: ad.extra_notes1 ?? null,
            extra_notes2: ad.extra_notes2 ?? null,
            priority_price: ad.priority_price ?? null,
            tax_amount_2: ad.tax_amount_2 ?? null,

            cs_col_bw_price: ad.cs_col_bw_price ?? 0,
            cs_col_bw_one_color_price: ad.cs_col_bw_one_color_price ?? 0,
            cs_col_bw_two_color_price: ad.cs_col_bw_two_color_price ?? 0,
            cs_col_full_color_price: ad.cs_col_full_color_price ?? 0,
            cs_page_bw_price: ad.cs_page_bw_price ?? 0,
            cs_page_bw_one_color_price: ad.cs_page_bw_one_color_price ?? 0,
            cs_page_bw_two_color_price: ad.cs_page_bw_two_color_price ?? 0,
            cs_page_full_color_price: ad.cs_page_full_color_price ?? 0,

            ad_sections: {
              create: ad.sections.map((section: any) => ({
                name: section.name,
                extra_notes: section.extra_notes ?? null,
                is_available: section.is_available ?? true,
                ad_section_sizes: {
                  createMany: {
                    data: section.sizes.map((sz: any) => ({
                      size_type: sz.size_type,
                      width: sz.width ?? 0,
                      height: sz.height ?? 0,
                      color_option: sz.color_option,
                      price: sz.price ?? 0,
                      is_available: sz.is_available ?? true,
                    })),
                  },
                },
              })),
            },
          },
        }),
      );
    }

    /* ----------------------------------------
       4️⃣ Execute atomically
    ---------------------------------------- */
    await prisma.$transaction(ops);

    return NextResponse.json({
      message: "Newspaper updated successfully",
    });
  } catch (error: any) {
    console.error("PUT /newspapers/[id] error:", error);

    return NextResponse.json(
      {
        message: "Failed to update newspaper",
        error: error?.message,
      },
      { status: 500 },
    );
  }
}

/* ----------------------------------------
   DELETE newspaper
---------------------------------------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.newspapers.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Newspaper not found" },
        { status: 404 },
      );
    }

    await prisma.newspapers.delete({ where: { id } });

    return NextResponse.json({ message: "Newspaper deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /newspapers/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to delete newspaper" },
      { status: 500 },
    );
  }
}
