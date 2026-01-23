export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "regenerator-runtime/runtime";

import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

const MAX_WORDS = 70;
const SINHALA_REGEX = /[\u0D80-\u0DFF]/;

const formatAdvertiserName = (name: string, maxLength = 20) => {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  let formatted = "";

  if (parts.length >= 3) {
    const firstInitial = parts[0][0] + ".";
    const secondInitial = parts[1][0] + ".";
    const lastName = parts[parts.length - 1];

    formatted = `${firstInitial} ${secondInitial} ${lastName}`;
  } else {
    formatted = name;
  }

  // Hard limit to maxLength (Unicode-safe)
  return [...formatted].slice(0, maxLength).join("");
};

export async function POST(req: Request) {
  try {
    const fontkit = require("@pdf-lib/fontkit").default;

    const {
      advertiser_name = "",
      advertisement_words = [],
      word_count = 0,
      category = "",
    } = await req.json();

    const pdfPath = path.join(
      process.cwd(),
      "public/pdf/sunday_lankadeepa_form.pdf",
    );

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Sinhala font
    const sinhalaFontBytes = fs.readFileSync(
      path.join(process.cwd(), "public/fonts/NotoSansSinhala-Regular.ttf"),
    );
    const sinhalaFont = await pdfDoc.embedFont(sinhalaFontBytes);

    // English font (built-in, no embed issues)
    const englishFont = await pdfDoc.embedFont("Helvetica");

    const page = pdfDoc.getPages()[0];

    const formattedAdvertiserName = formatAdvertiserName(advertiser_name);

    page.drawText(formattedAdvertiserName, {
      x: 220,
      y: 112,
      size: 10,
      font: SINHALA_REGEX.test(formattedAdvertiserName)
        ? sinhalaFont
        : englishFont,
    });

    // =========================
    // FIXED GRID COORDINATES
    // =========================
    const COLUMN_X = [24, 137, 252, 362, 474];
    const ROW_Y = [
      539, 516, 492, 471, 450, 428, 405, 383, 360, 339, 316, 294, 272, 250,
    ];

    const wordsToPrint = Math.min(
      advertisement_words.length,
      word_count,
      MAX_WORDS,
      COLUMN_X.length * ROW_Y.length,
    );

    for (let i = 0; i < wordsToPrint; i++) {
      const col = i % COLUMN_X.length;
      const row = Math.floor(i / COLUMN_X.length);

      if (row >= ROW_Y.length) break;

      const word = advertisement_words[i];
      const fontToUse = SINHALA_REGEX.test(word) ? sinhalaFont : englishFont;

      page.drawText(word, {
        x: COLUMN_X[col],
        y: ROW_Y[row],
        size: 9,
        font: fontToUse,
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=advertisement-print.pdf",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 },
    );
  }
}
