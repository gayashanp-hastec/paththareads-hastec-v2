import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "newspaper_data.json");

/* ---------- Helpers ---------- */
const readData = () => {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeData = (data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

/* ---------- UPDATE newspaper ---------- */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ MUST await params
  const body = await req.json();

  const data = readData();

  if (!data[id]) {
    return NextResponse.json({ error: "Newspaper not found" }, { status: 404 });
  }

  data[id] = {
    ...data[id],
    ...body,
    id, // ensure id remains consistent
  };

  writeData(data);

  return NextResponse.json({ success: true });
}

/* ---------- DELETE newspaper ---------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ MUST await params

  const data = readData();

  if (!data[id]) {
    return NextResponse.json({ error: "Newspaper not found" }, { status: 404 });
  }

  delete data[id];
  writeData(data);

  return NextResponse.json({ success: true });
}
