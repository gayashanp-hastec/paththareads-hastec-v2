import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ "newspaper-id": string }> }
) {
  const resolvedParams = await context.params;
  const newspaperId = resolvedParams["newspaper-id"];

  if (!newspaperId) {
    return new Response(JSON.stringify({ error: "Missing newspaperId" }), {
      status: 400,
    });
  }

  try {
    const adTypes = await prisma.ad_types.findMany({
      where: { newspaper_id: newspaperId },
      include: {
        ad_type_categories: true,
      },
      orderBy: {
        key: "asc", // <-- sort ascending by 'key'
      },
    });

    const adTypesWithSubcats = await Promise.all(
      adTypes.map(async (adType) => {
        const categoriesWithSubcats = await Promise.all(
          adType.ad_type_categories.map(async (cat) => {
            const adCategory = await prisma.ad_categories.findUnique({
              where: { name: cat.category },
              include: { ad_sub_categories: true },
            });
            return {
              category: cat.category,
              subCategories: adCategory?.ad_sub_categories || [],
            };
          })
        );
        return {
          ...adType,
          categories: categoriesWithSubcats,
        };
      })
    );

    return new Response(JSON.stringify(adTypesWithSubcats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch ad types" }), {
      status: 500,
    });
  }
}
