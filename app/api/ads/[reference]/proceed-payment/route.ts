import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    // 👇 FIX: next.js 15 requires awaiting the params
    const { reference } = await context.params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const amount = formData.get("amount") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File is missing" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filename = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Update advertisement status
    await prisma.advertisements.update({
      where: { reference_number: reference },
      data: { status: "PaymentPending" },
    });

    // Create payment record
    const payment = await prisma.payment_ads.create({
      data: {
        reference_number: reference,
        file_path: `/uploads/${filename}`,
        original_filename: file.name,
        amount: amount ? parseFloat(amount) : null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (err: unknown) {
    console.error("Error submitting payment:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
