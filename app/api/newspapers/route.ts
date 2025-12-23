import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all newspapers
export async function GET() {
  const newspapers = await prisma.newspapers.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      newspaper_img: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // 🔁 Match frontend key names
  const formatted = newspapers.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    newspaperimg: n.newspaper_img,
  }));

  return NextResponse.json(formatted);
}
