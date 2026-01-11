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
          include: {
            ad_sections: {
              orderBy: { id: "asc" },
              include: {
                ad_section_sizes: {
                  orderBy: { id: "asc" },
                },
              },
            },
          },
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
      name_sinhala,
      is_lang_combine_allowed,
      combine_eng_price,
      combine_tam_price,
      combine_eng_tam_price,
      allowed_weekdays = [],
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
          name_sinhala,
          is_lang_combine_allowed,
          combine_eng_price,
          combine_tam_price,
          combine_eng_tam_price,
          allowed_weekdays,
        },
      });

      // 2️⃣ Remove old ad types + sections + sizes
      const existingAdTypes = await tx.ad_types.findMany({
        where: { newspaper_id: id },
        include: { ad_sections: { include: { ad_section_sizes: true } } },
      });

      for (const ad of existingAdTypes) {
        for (const section of ad.ad_sections) {
          await tx.ad_section_sizes.deleteMany({
            where: { section_id: section.id },
          });
        }
        await tx.ad_sections.deleteMany({ where: { ad_type_id: ad.id } });
      }
      await tx.ad_types.deleteMany({ where: { newspaper_id: id } });

      // 3️⃣ Create new ad types + sections + sizes
      for (const ad of ad_types) {
        const createdAdType = await tx.ad_types.create({
          data: {
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
            cs_col_bw_price: ad.cs_col_bw_price,
            cs_col_bw_one_color_price: ad.cs_col_bw_one_color_price,
            cs_col_bw_two_color_price: ad.cs_col_bw_two_color_price,
            cs_col_full_color_price: ad.cs_col_full_color_price,
            cs_page_bw_price: ad.cs_page_bw_price,
            cs_page_bw_one_color_price: ad.cs_page_bw_one_color_price,
            cs_page_bw_two_color_price: ad.cs_page_bw_two_color_price,
            cs_page_full_color_price: ad.cs_page_full_color_price,
            is_upload_image: ad.is_upload_image,
            extra_notes1: ad.extra_notes1 ?? null,
            extra_notes2: ad.extra_notes2 ?? null,
            priority_price: ad.priority_price ?? null,
            tax_amount_2: ad.tax_amount ?? null,
          },
        });

        if (ad.sections && ad.sections.length > 0) {
          for (const section of ad.sections) {
            const createdSection = await tx.ad_sections.create({
              data: {
                ad_type_id: createdAdType.id,
                name: section.name,
                extra_notes: section.extra_notes ?? null,
                is_available: section.is_available,
              },
            });

            if (section.sizes && section.sizes.length > 0) {
              await tx.ad_section_sizes.createMany({
                data: section.sizes.map((sz: any) => ({
                  section_id: createdSection.id,
                  size_type: sz.size_type,
                  width: sz.width ?? 0,
                  height: sz.height ?? 0,
                  color_option: sz.color_option,
                  price: sz.price ?? 0,
                  is_available: sz.is_available,
                })),
              });
            }
          }
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
