import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "newspaper_data.json");

// Helper: Read file
const readData = () => {
  const json = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(json);
};

// Helper: Write file
const writeData = (data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// GET all newspapers
export async function GET() {
  const data = readData();
  return NextResponse.json(Object.values(data));
}

// CREATE new newspaper
export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();

  const type = body.type.toLowerCase(); // "daily" or "sunday"

  // Filter existing IDs belonging to that type
  const existingKeys = Object.keys(data).filter((key) => key.startsWith(type));

  // Extract the numbers from keys (daily0 -> 0, daily1 -> 1)
  const numbers = existingKeys.map((key) =>
    parseInt(key.replace(type, ""), 10)
  );

  // Next available number
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 0;

  const newId = `${type}${nextNumber}`;

  // const ext = body.newspaperimg.split(".").pop();
  // body.newspaperimg = `${newId}.${ext}`;

  data[newId] = { id: newId, ...body };

  writeData(data);

  return NextResponse.json({ success: true, id: newId });
}
