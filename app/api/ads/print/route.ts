export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "regenerator-runtime/runtime";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const SINHALA_REGEX = /[\u0D80-\u0DFF]/;
const MAX_WORDS = 70;
const CROSS_SIZE = 6;
const CROSS_SIZE_SMALL = 4;
const CROSS_SIZE_SMALL_XS = 3;
//color option
let color_x = 0;
let color_y = 0;

const formatColorType = (value: string): string => {
  switch (value?.toLowerCase()) {
    case "full":
      return "F/C";
    case "bw":
      return "BW";
    case "bw1":
      return "BW+1 color";
    case "bw2":
      return "BW+2 colors";
    default:
      return value; // fallback (safe)
  }
};

// Format advertiser name
const formatAdvertiserName = (name: string, maxLength = 30) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  let formatted = "";
  if (parts.length > 3) {
    formatted = `${parts[0][0]}. ${parts[1][0]}. ${parts[parts.length - 1]}`;
  } else {
    formatted = name;
  }
  return [...formatted].slice(0, maxLength).join("");
};

function getSignature(str: string): string {
  if (!str) return ""; // handle empty or undefined
  return str.trim().split(/\s+/)[0]; // split by whitespace and return first element
}

// Split text based on agency.ad_text_type
const normalizeAdText = (text: string, type: string | null) => {
  if (!text) return [];
  const words = text.trim().split(/\s+/);

  if (type === "sentence") {
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += 5) {
      chunks.push(words.slice(i, i + 5).join(" "));
    }
    return chunks;
  }
  // Default: word type
  return words;
};

const getTodayYMD = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

// Conditional coordinates per publisher (can expand)
const getCoordinates = (publisherName: string) => {
  switch (publisherName?.toLowerCase()) {
    case "wijeya_newspapers":
      return {
        COLUMN_X: [24, 137, 252, 362, 474],
        ROW_Y: [
          539, 516, 492, 471, 450, 428, 405, 383, 360, 339, 316, 294, 272, 250,
        ],
      };
    case "associated_newspapers":
      return {
        COLUMN_X: [25, 132, 245, 360, 472],
        ROW_Y: [320, 290, 260, 230, 200, 170, 145, 115, 85],
      };
    case "liberty_publishers":
      return {
        COLUMN_X: [20, 127, 238, 348, 453],
        ROW_Y: [
          478, 455, 432, 410, 388, 365, 342, 322, 300, 278, 256, 234, 212,
        ],
      };
    case "ceylon_newspapers":
      return {
        COLUMN_X: [24, 137, 252, 362, 474],
        ROW_Y: [
          578, 557, 533, 512, 491, 471, 446, 424, 401, 380, 357, 335, 313, 292,
          271,
        ],
      };
    default:
      return {
        COLUMN_X: [24, 137, 252, 362, 474],
        ROW_Y: [
          539, 516, 492, 471, 450, 428, 405, 383, 360, 339, 316, 294, 272, 250,
        ],
      };
  }
};

function drawAdTextBlock(
  page: any,
  adText: string,
  x: number,
  startY: number,
  gap: number,
  sinhalaFont: any,
  englishFont: any,
) {
  const MAX_CHARS = 90;
  const MAX_LINES = 15;
  const FONT_SIZE = 9.5;
  const SINHALA_REGEX = /[\u0D80-\u0DFF]/;

  if (!adText?.trim()) return;

  const words = adText.trim().split(/\s+/);
  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= MAX_CHARS) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length === MAX_LINES) break;
    }
  }

  if (currentLine && lines.length < MAX_LINES) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: startY - index * gap,
      size: FONT_SIZE,
      font: SINHALA_REGEX.test(line) ? sinhalaFont : englishFont,
    });
  });
}

const shortenNewspaperName = (name: string, maxLength = 14) => {
  if (!name || name.length <= maxLength) return name;

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return name.slice(0, maxLength);

  const firstWordInitial = parts[0][0];
  const rest = parts.slice(1).join(" ");

  return `${firstWordInitial}/${rest}`;
};

export async function POST(req: Request) {
  try {
    const fontkit = require("@pdf-lib/fontkit").default;

    const {
      /* ---------------- Core identifiers ---------------- */
      reference_number = "",
      newspaper_name = "",
      newspaper_id = "",
      language = "",

      /* ---------------- Advertiser details ---------------- */
      advertiser_name = "",
      advertiser_nic = null,
      advertiser_phone = null,
      advertiser_address = null,

      /* ---------------- Ad classification ---------------- */
      ad_type = "",
      category = null,
      subcategory = null,

      /* ---------------- Dates ---------------- */
      publish_date = null,
      created_at = "",
      updated_at = null,

      /* ---------------- Text & content ---------------- */
      advertisement_text = "",
      advertisement_words = [],
      word_count = 0,
      special_notes = null,

      /* ---------------- Flags ---------------- */
      background_color = null,
      post_in_web = null,

      /* ---------------- Media ---------------- */
      upload_image = null,

      /* ---------------- Pricing & status ---------------- */
      price = null,
      status = "",

      /* ---------------- Casual Ad ---------------- */
      casual_ad = null,

      /* ---------------- Classified Ad ---------------- */
      classified_ad = null,
    } = await req.json();

    // Create a structured object to display in console
    const displayData = {
      "Core Identifiers": {
        reference_number,
        newspaper_name,
        newspaper_id,
        language,
      },
      "Advertiser Details": {
        advertiser_name,
        advertiser_nic,
        advertiser_phone,
        advertiser_address,
      },
      "Ad Classification": { ad_type, category, subcategory },
      Dates: { publish_date, created_at, updated_at },
      "Text & Content": {
        advertisement_text,
        advertisement_words,
        word_count,
        special_notes,
      },
      Flags: { background_color, post_in_web },
      Media: { upload_image },
      "Pricing & Status": { price, status },
      "Casual Ad": casual_ad,
      "Classified Ad": classified_ad,
    };

    // Print nicely in frontend console
    console.log(
      "%cReceived Advertisement Data:",
      "color: blue; font-weight: bold;",
      displayData,
    );

    // Find agency for this newspaper
    const agency = newspaper_id
      ? await prisma.agency.findFirst({
          where: { papers: { has: newspaper_id } },
        })
      : null;

    if (!agency?.publisher_name) {
      return NextResponse.json(
        { error: "No publisher found for this newspaper" },
        { status: 400 },
      );
    }

    // Load PDF dynamically
    const pdfFileName =
      ad_type === "classified"
        ? `${agency.publisher_name}_classified.pdf`
        : `${agency.publisher_name}.pdf`;

    console.log(pdfFileName);

    const pdfPath = path.join(process.cwd(), "public/pdf", pdfFileName);

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        {
          error: `PDF template not found for publisher ${agency.publisher_name}`,
        },
        { status: 404 },
      );
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const sinhalaFontBytes = fs.readFileSync(
      path.join(process.cwd(), "public/fonts/NotoSansSinhala-Regular.ttf"),
    );
    const sinhalaFont = await pdfDoc.embedFont(sinhalaFontBytes);
    const englishFont = await pdfDoc.embedFont("Helvetica");

    const page = pdfDoc.getPages()[0];

    const agentName = agency?.agent_name ?? "";
    const agentAddress = agency?.agent_address ?? "";
    const agentTel = agency?.agent_tel ?? "";
    const agentNo = agency?.agent_no ?? "";
    const papers = agency?.papers ?? [];
    const createdAt = agency?.created_at ?? null;
    const publisherName = agency?.publisher_name ?? "";
    const adTextType = agency?.ad_text_type ?? "word"; // default to 'word'

    console.log(newspaper_id);

    if (publisherName === "wijeya_newspapers") {
      // Newspapers to publish it on

      if (newspaper_id === "SUNDAY_LANKADEEPA") {
        // Draw a cross
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 776 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 776 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 776 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 776 - CROSS_SIZE },
          thickness: 1,
        });

        if (classified_ad?.is_publish_eng) {
          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 693 - CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 693 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 693 + CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 693 - CROSS_SIZE },
            thickness: 1,
          });
        }
      }

      if (newspaper_id === "DAILY_LANKADEEPA") {
        // Draw a cross
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 757 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 757 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 757 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 757 - CROSS_SIZE },
          thickness: 1,
        });
      }

      if (newspaper_id === "SUNDAY_TIMES") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 692 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 692 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 692 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 692 - CROSS_SIZE },
          thickness: 1,
        });

        if (classified_ad?.is_publish_sin) {
          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 776 - CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 776 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 776 + CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 776 - CROSS_SIZE },
            thickness: 1,
          });
        }
      }

      if (newspaper_id === "SIRIKATHA") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 733 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 733 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 733 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 733 - CROSS_SIZE },
          thickness: 1,
        });
      }

      if (newspaper_id === "WIJEYA") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 718 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 718 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 718 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 718 - CROSS_SIZE },
          thickness: 1,
        });
      }

      if (newspaper_id === "BILINDU") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 642 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 642 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 642 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 642 - CROSS_SIZE },
          thickness: 1,
        });
      }

      // Draw agent details
      // page.drawText(String(agentName ?? ""), {
      //   x: 70,
      //   y: 759,
      //   size: 10,
      //   font: SINHALA_REGEX.test(agentName) ? sinhalaFont : englishFont,
      // });

      // page.drawText(String(agentAddress ?? ""), {
      //   x: 79,
      //   y: 780,
      //   size: 10,
      //   font: SINHALA_REGEX.test(agentAddress) ? sinhalaFont : englishFont,
      // });

      // page.drawText(String(agentTel ?? ""), {
      //   x: 53,
      //   y: 727,
      //   size: 10,
      //   font: SINHALA_REGEX.test(agentTel) ? sinhalaFont : englishFont,
      // });

      page.drawText(String(word_count ?? ""), {
        x: 310,
        y: 705,
        size: 10,
        font: SINHALA_REGEX.test(word_count) ? sinhalaFont : englishFont,
      });

      // page.drawText(String(agentNo ?? ""), {
      //   x: 244,
      //   y: 727,
      //   size: 10,
      //   font: SINHALA_REGEX.test(agentNo) ? sinhalaFont : englishFont,
      // });

      // Draw publish date
      page.drawText(String(publish_date ?? ""), {
        x: 500,
        y: 775,
        size: 10,
        font: SINHALA_REGEX.test(String(publish_date))
          ? sinhalaFont
          : englishFont,
      });

      // Draw a tick
      // page.drawLine({
      //   start: { x: 571, y: 684 },
      //   end: { x: 566, y: 679 },
      //   thickness: 2,
      // });

      // // page.drawLine({
      // //   start: { x: 200, y: 300 },
      // //   end: { x: 206, y: 294 },
      // //   thickness: 2,
      // // });

      // page.drawLine({
      //   start: { x: 571, y: 679 },
      //   end: { x: 576, y: 689 },
      //   thickness: 2,
      // });

      if (background_color) {
        // Draw a cross
        page.drawLine({
          start: { x: 573 - CROSS_SIZE, y: 685 - CROSS_SIZE },
          end: { x: 573 + CROSS_SIZE, y: 685 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 573 - CROSS_SIZE, y: 685 + CROSS_SIZE },
          end: { x: 573 + CROSS_SIZE, y: 685 - CROSS_SIZE },
          thickness: 1,
        });
      }

      // Draw casual ad dimensions
      if (casual_ad && casual_ad?.no_of_boxes === 0) {
        page.drawText(String(casual_ad?.ad_height ?? ""), {
          x: 358,
          y: 755,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(" x ", {
          x: 377,
          y: 755,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });

        page.drawText(String(casual_ad?.no_of_columns ?? ""), {
          x: 395,
          y: 755,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
            ? sinhalaFont
            : englishFont,
        });
        const color_opt = formatColorType(casual_ad?.color_option);
        page.drawText(String(color_opt ?? ""), {
          x: 356,
          y: 648,
          size: 8,
          font: SINHALA_REGEX.test(String(color_opt))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (casual_ad?.no_of_boxes > 0) {
        page.drawText("Box Ad", {
          x: 360,
          y: 755,
          size: 10,
          font: SINHALA_REGEX.test("Box Ad") ? sinhalaFont : englishFont,
        });

        page.drawText(String(casual_ad?.no_of_boxes) + " boxes", {
          x: 360,
          y: 745,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.no_of_boxes) + " boxes")
            ? sinhalaFont
            : englishFont,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 680 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 680 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 680 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 680 - CROSS_SIZE },
          thickness: 1,
        });
      }

      // Draw category
      page.drawText(String(subcategory ?? ""), {
        x: 86,
        y: 680,
        size: 10,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });

      // Draw advertiser details
      const formattedName = formatAdvertiserName(advertiser_name);
      page.drawText(String(formattedName), {
        x: 220,
        y: 112,
        size: 10,
        font: SINHALA_REGEX.test(String(formattedName))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_address ?? ""), {
        x: 115,
        y: 95,
        size: 10,
        font: SINHALA_REGEX.test(String(advertiser_address))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 57,
        y: 59,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 324,
        y: 59,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(getSignature(advertiser_name)), {
        x: 213,
        y: 15,
        size: 9,
        font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(price ?? ""), {
        x: 465,
        y: 92,
        size: 10,
        font: SINHALA_REGEX.test(String(price)) ? sinhalaFont : englishFont,
      });

      // draw reference number as receipt number
      page.drawText(String(reference_number ?? ""), {
        x: 341,
        y: 18,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      // Normalize ad text based on agency.ad_text_type
      const normalizedText = normalizeAdText(
        advertisement_text,
        agency.ad_text_type,
      );

      // Get publisher-specific coordinates
      const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);

      const wordsToPrint = Math.min(
        normalizedText.length,
        MAX_WORDS,
        COLUMN_X.length * ROW_Y.length,
      );

      // Draw ad text
      for (let i = 0; i < wordsToPrint; i++) {
        const col = i % COLUMN_X.length;
        const row = Math.floor(i / COLUMN_X.length);
        if (row >= ROW_Y.length) break;

        const text = normalizedText[i];
        const fontToUse = SINHALA_REGEX.test(text) ? sinhalaFont : englishFont;

        page.drawText(text, {
          x: COLUMN_X[col],
          y: ROW_Y[row],
          size: 9,
          font: fontToUse,
        });
      }
    }
    if (publisherName === "associated_newspapers") {
      if (ad_type === "casual") {
        // Newspaper details row
        const displayName = shortenNewspaperName(newspaper_name);
        page.drawText(String(displayName ?? ""), {
          x: 38.8,
          y: 534,
          size: 9,
          font: SINHALA_REGEX.test(String(displayName))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 105.5,
          y: 534,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });

        // if (casual_ad) {
        //   if (casual_ad?.no_of_boxes === 0) {
        //     page.drawText(String(casual_ad?.ad_height ?? ""), {
        //       x: 241,
        //       y: 534,
        //       size: 10,
        //       font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
        //         ? sinhalaFont
        //         : englishFont,
        //     });

        //     page.drawText(" x ", {
        //       x: 270,
        //       y: 534,
        //       size: 10,
        //       font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        //     });

        //     page.drawText(String(casual_ad?.no_of_columns ?? ""), {
        //       x: 281,
        //       y: 534,
        //       size: 10,
        //       font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
        //         ? sinhalaFont
        //         : englishFont,
        //     });
        //   }
        // }

        // Draw category
        page.drawText(String(subcategory ?? ""), {
          x: 312,
          y: 534,
          size: 10,
          font: SINHALA_REGEX.test(String(subcategory))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(String(price ?? ""), {
          x: 372,
          y: 534,
          size: 10,
          font: SINHALA_REGEX.test(String(price)) ? sinhalaFont : englishFont,
        });

        // Draw date
        const todayDate = getTodayYMD();
        page.drawText(String(todayDate ?? ""), {
          x: 244,
          y: 639,
          size: 10,
          font: SINHALA_REGEX.test(String(todayDate))
            ? sinhalaFont
            : englishFont,
        });

        // Draw casual ad dimensions
        if (casual_ad?.ad_size === "custom") {
          page.drawText(String(casual_ad?.ad_height ?? "") + "cm", {
            x: 242,
            y: 533,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_height) + "cm")
              ? sinhalaFont
              : englishFont,
          });

          page.drawText(" x ", {
            x: 265,
            y: 533,
            size: 10,
            font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
          });

          page.drawText(String(casual_ad?.no_of_columns ?? "") + "col", {
            x: 280,
            y: 533,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns) + "col")
              ? sinhalaFont
              : englishFont,
          });
        } else {
          page.drawText(String(casual_ad?.ad_size ?? ""), {
            x: 242,
            y: 533,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
              ? sinhalaFont
              : englishFont,
          });
        }

        // page.drawText(String(casual_ad?.color_option ?? ""), {
        //   x: 356,
        //   y: 648,
        //   size: 8,
        //   font: SINHALA_REGEX.test(String(casual_ad?.color_option))
        //     ? sinhalaFont
        //     : englishFont,
        // });

        if (casual_ad?.no_of_boxes > 0) {
          page.drawText("Box: " + String(casual_ad?.no_of_boxes ?? ""), {
            x: 243.35,
            y: 530.8,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
              ? sinhalaFont
              : englishFont,
          });
        }

        if (classified_ad?.is_co_paper) {
          page.drawLine({
            start: { x: 352 - CROSS_SIZE, y: 627 - CROSS_SIZE },
            end: { x: 352 + CROSS_SIZE, y: 627 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 352 - CROSS_SIZE, y: 627 + CROSS_SIZE },
            end: { x: 352 + CROSS_SIZE, y: 627 - CROSS_SIZE },
            thickness: 1,
          });
        }

        if (
          classified_ad?.is_int_bw ||
          classified_ad?.is_int_fc ||
          classified_ad?.is_int_highlight
        ) {
          page.drawLine({
            start: { x: 450 - CROSS_SIZE, y: 627 - CROSS_SIZE },
            end: { x: 450 + CROSS_SIZE, y: 627 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 450 - CROSS_SIZE, y: 627 + CROSS_SIZE },
            end: { x: 450 + CROSS_SIZE, y: 627 - CROSS_SIZE },
            thickness: 1,
          });
        }

        // Draw advertiser details
        const formattedName = formatAdvertiserName(advertiser_name);
        page.drawText(String(formattedName), {
          x: 128,
          y: 151,
          size: 10,
          font: SINHALA_REGEX.test(String(formattedName))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(String(advertiser_address ?? ""), {
          x: 89,
          y: 121,
          size: 10,
          font: SINHALA_REGEX.test(String(advertiser_address))
            ? sinhalaFont
            : englishFont,
        });

        const PHONE_X = [112, 130, 146, 163, 180, 197, 213, 230, 247, 264];
        const PHONE_Y = 41;

        // Normalize phone: 94xxxxxxxxx → 0xxxxxxxxx
        let phoneDigits = String(advertiser_phone ?? "").replace(/\D/g, "");

        if (phoneDigits.startsWith("94") && phoneDigits.length >= 11) {
          phoneDigits = "0" + phoneDigits.slice(-9);
        }

        // Safety: ensure max 10 digits
        phoneDigits = phoneDigits.slice(0, 10);

        for (let i = 0; i < phoneDigits.length; i++) {
          page.drawText(phoneDigits[i], {
            x: PHONE_X[i],
            y: PHONE_Y,
            size: 9,
            font: SINHALA_REGEX.test(phoneDigits[i])
              ? sinhalaFont
              : englishFont,
          });
        }

        const NIC_X = [
          112, 130, 146, 163, 180, 197, 213, 230, 247, 264, 280, 296,
        ];
        const NIC_Y = 78;

        const nic = String(advertiser_nic ?? "")
          .toUpperCase()
          .slice(0, NIC_X.length);

        for (let i = 0; i < nic.length; i++) {
          page.drawText(nic[i], {
            x: NIC_X[i],
            y: NIC_Y,
            size: 9,
            font: SINHALA_REGEX.test(nic[i]) ? sinhalaFont : englishFont,
          });
        }

        page.drawText(String(getSignature(advertiser_name)), {
          x: 439,
          y: 77,
          size: 9,
          font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(todayDate, {
          x: 434,
          y: 36,
          size: 9,
          font: englishFont, // date is always English digits
        });

        // page.drawText(String(price ?? ""), {
        //   x: 465,
        //   y: 92,
        //   size: 10,
        //   font: SINHALA_REGEX.test(String(price)) ? sinhalaFont : englishFont,
        // });

        // draw reference number as receipt number
        page.drawText(String(reference_number ?? ""), {
          x: 317,
          y: 728,
          size: 8,
          font: SINHALA_REGEX.test(String(reference_number))
            ? sinhalaFont
            : englishFont,
        });

        drawAdTextBlock(
          page,
          advertisement_text,
          45, // x
          423, // starting Y
          17, // line gap
          sinhalaFont,
          englishFont,
        );
      } else {
        page.drawText(String(advertiser_name), {
          x: 97.75,
          y: 729,
          size: 9,
          font: SINHALA_REGEX.test(String(advertiser_name))
            ? sinhalaFont
            : englishFont,
        });
        page.drawText(String(advertiser_address), {
          x: 53,
          y: 683,
          size: 9,
          font: SINHALA_REGEX.test(String(advertiser_address))
            ? sinhalaFont
            : englishFont,
        });
        // advertiser tel number
        const PHONE_X = [80, 97, 115, 134, 153, 173, 191, 210, 228, 245];
        const PHONE_Y = 569;

        // Normalize phone: 94xxxxxxxxx → 0xxxxxxxxx
        let phoneDigits = String(advertiser_phone ?? "").replace(/\D/g, "");

        if (phoneDigits.startsWith("94") && phoneDigits.length >= 11) {
          phoneDigits = "0" + phoneDigits.slice(-9);
        }

        // Safety: ensure max 10 digits
        phoneDigits = phoneDigits.slice(0, 10);

        for (let i = 0; i < phoneDigits.length; i++) {
          page.drawText(phoneDigits[i], {
            x: PHONE_X[i],
            y: PHONE_Y,
            size: 10,
            font: SINHALA_REGEX.test(phoneDigits[i])
              ? sinhalaFont
              : englishFont,
          });
        }

        // advertiser nic
        const NIC_X = [
          80, 97, 115, 134, 153, 173, 191, 210, 228, 245, 260, 270,
        ];
        const NIC_Y = 602;

        const nic = String(advertiser_nic ?? "")
          .toUpperCase()
          .slice(0, NIC_X.length);

        for (let i = 0; i < nic.length; i++) {
          page.drawText(nic[i], {
            x: NIC_X[i],
            y: NIC_Y,
            size: 10,
            font: SINHALA_REGEX.test(nic[i]) ? sinhalaFont : englishFont,
          });
        }

        // marking multiple newspapers
        if (newspaper_id === "SILUMINA") {
          // SILUMINA cross
          page.drawLine({
            start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
            end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
            end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
            thickness: 1,
          });

          if (classified_ad?.is_publish_eng) {
            // S/ovserver cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 455.12 - CROSS_SIZE_SMALL,
              },
              end: {
                x: 23.65 + CROSS_SIZE_SMALL,
                y: 455.12 + CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 455.12 + CROSS_SIZE_SMALL,
              },
              end: {
                x: 23.65 + CROSS_SIZE_SMALL,
                y: 455.12 - CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_tam) {
            // varamanjari cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_eng_tam) {
            // S/ovserver cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 455.12 - CROSS_SIZE_SMALL,
              },
              end: {
                x: 23.65 + CROSS_SIZE_SMALL,
                y: 455.12 + CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 455.12 + CROSS_SIZE_SMALL,
              },
              end: {
                x: 23.65 + CROSS_SIZE_SMALL,
                y: 455.12 - CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });
            // varamanjari cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }
        } else if (newspaper_id === "SUNDAY_OBSERVER") {
          // S/ovserver cross
          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 455.12 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 455.12 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 455.12 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 455.12 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          if (classified_ad?.is_publish_sin) {
            // SILUMINA cross
            page.drawLine({
              start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_tam) {
            // varamanjari cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_sin_tam) {
            // SILUMINA cross
            page.drawLine({
              start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: { x: 23.65 - CROSS_SIZE_SMALL, y: 507 + CROSS_SIZE_SMALL },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 507 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
            // varamanjari cross
            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 23.65 - CROSS_SIZE_SMALL,
                y: 403.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 23.65 + CROSS_SIZE_SMALL, y: 403.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }
        } else if (newspaper_id === "DAILY_DINAMINA") {
          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 482 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 482 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 482 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 482 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        } else if (newspaper_id === "DAILY_NEWS") {
          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 429 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 429 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 23.65 - CROSS_SIZE_SMALL,
              y: 429 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 23.65 + CROSS_SIZE_SMALL,
              y: 429 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        }

        // publishing date and month
        const dateStr = String(publish_date ?? "");

        let day = "";
        let month = "";

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [, mm, dd] = dateStr.split("-");
          month = mm;
          day = dd;
        }

        // DATE → dd
        page.drawText(day, {
          x: 137.48,
          y: 460,
          size: 9,
          font: SINHALA_REGEX.test(day) ? sinhalaFont : englishFont,
        });

        // MONTH → mm
        page.drawText(month, {
          x: 180,
          y: 460,
          size: 9,
          font: SINHALA_REGEX.test(month) ? sinhalaFont : englishFont,
        });

        page.drawText(String(word_count ?? ""), {
          x: 360,
          y: 462,
          size: 10,
          font: SINHALA_REGEX.test(word_count) ? sinhalaFont : englishFont,
        });

        // advertiser nic
        const category_X = [511, 540, 570];
        const category_Y = 394;

        const cat = String(subcategory ?? "")
          .toUpperCase()
          .slice(0, NIC_X.length);

        for (let i = 0; i < cat.length; i++) {
          page.drawText(cat[i], {
            x: category_X[i],
            y: category_Y,
            size: 11,
            font: SINHALA_REGEX.test(cat[i]) ? sinhalaFont : englishFont,
          });
        }

        // draw co paper
        if (classified_ad?.is_co_paper) {
          page.drawLine({
            start: {
              x: 356 - CROSS_SIZE_SMALL,
              y: 433 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 356 + CROSS_SIZE_SMALL,
              y: 433 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 356 - CROSS_SIZE_SMALL,
              y: 433 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 356 + CROSS_SIZE_SMALL,
              y: 433 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        }

        page.drawText(String(price ?? ""), {
          x: 509,
          y: 462,
          size: 10,
          font: SINHALA_REGEX.test(price) ? sinhalaFont : englishFont,
        });

        // printing ad text
        // Normalize ad text based on agency.ad_text_type
        const normalizedText = normalizeAdText(
          advertisement_text,
          agency.ad_text_type,
        );

        // Get publisher-specific coordinates
        const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);

        const wordsToPrint = Math.min(
          normalizedText.length,
          MAX_WORDS,
          COLUMN_X.length * ROW_Y.length,
        );

        // Draw ad text
        for (let i = 0; i < wordsToPrint; i++) {
          const col = i % COLUMN_X.length;
          const row = Math.floor(i / COLUMN_X.length);
          if (row >= ROW_Y.length) break;

          const text = normalizedText[i];
          const fontToUse = SINHALA_REGEX.test(text)
            ? sinhalaFont
            : englishFont;
          console.log("text here: ", text);
          page.drawText(text, {
            x: COLUMN_X[col],
            y: ROW_Y[row],
            size: 9,
            font: fontToUse,
          });
        }
        // draw advertiser signature
        page.drawText(String(getSignature(advertiser_name)), {
          x: 375,
          y: 45,
          size: 9,
          font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
            ? sinhalaFont
            : englishFont,
        });
      }
    }
    if (publisherName === "liberty_publishers") {
      //receipt
      page.drawText(String(reference_number ?? ""), {
        x: 41,
        y: 537,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      //word count
      page.drawText(String(word_count ?? ""), {
        x: 340,
        y: 710,
        size: 9,
        font: SINHALA_REGEX.test(String(word_count))
          ? sinhalaFont
          : englishFont,
      });

      //category
      page.drawText(String(subcategory ?? ""), {
        x: 340,
        y: 663,
        size: 9,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });

      //h x w
      page.drawText(String(casual_ad?.ad_height ?? ""), {
        x: 465,
        y: 669,
        size: 10,
        font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
          ? sinhalaFont
          : englishFont,
      });

      // page.drawText(" x ", {
      //   x: 270,
      //   y: 534,
      //   size: 10,
      //   font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
      // });

      page.drawText(String(casual_ad?.no_of_columns ?? ""), {
        x: 530,
        y: 669,
        size: 10,
        font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
          ? sinhalaFont
          : englishFont,
      });

      if (casual_ad?.color_option === "full_color") {
        color_x = 498;
        color_y = 533;
      } else if (casual_ad?.color_option === "bw1") {
        color_x = 498;
        color_y = 564;
      } else if (casual_ad?.color_option === "bw2") {
        color_x = 498;
        color_y = 549;
      } else if (casual_ad?.color_option === "bw") {
        color_x = 498;
        color_y = 582;
      }

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL_XS,
          y: color_y - CROSS_SIZE_SMALL_XS,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL_XS,
          y: color_y + CROSS_SIZE_SMALL_XS,
        },
        thickness: 1,
      });

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL_XS,
          y: color_y + CROSS_SIZE_SMALL_XS,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL_XS,
          y: color_y - CROSS_SIZE_SMALL_XS,
        },
        thickness: 1,
      });

      // Normalize ad text based on agency.ad_text_type
      const normalizedText = normalizeAdText(
        advertisement_text,
        agency.ad_text_type,
      );

      // Get publisher-specific coordinates
      const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);

      const wordsToPrint = Math.min(
        normalizedText.length,
        MAX_WORDS,
        COLUMN_X.length * ROW_Y.length,
      );

      // Draw ad text
      for (let i = 0; i < wordsToPrint; i++) {
        const col = i % COLUMN_X.length;
        const row = Math.floor(i / COLUMN_X.length);
        if (row >= ROW_Y.length) break;

        const text = normalizedText[i];
        const fontToUse = SINHALA_REGEX.test(text) ? sinhalaFont : englishFont;

        page.drawText(text, {
          x: COLUMN_X[col],
          y: ROW_Y[row],
          size: 10,
          font: fontToUse,
        });
      }

      //advertiser details
      const formattedName = formatAdvertiserName(advertiser_name);
      page.drawText(String(formattedName), {
        x: 43,
        y: 92,
        size: 10,
        font: SINHALA_REGEX.test(String(formattedName))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_address ?? ""), {
        x: 50,
        y: 69,
        size: 10,
        font: SINHALA_REGEX.test(String(advertiser_address))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 235,
        y: 45,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 73,
        y: 45,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(getSignature(advertiser_name)), {
        x: 225,
        y: 20,
        size: 9,
        font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
          ? sinhalaFont
          : englishFont,
      });

      // is photo classified?
      if (ad_type === "photo_classified") {
        page.drawLine({
          start: { x: 405 - CROSS_SIZE_SMALL, y: 537 - CROSS_SIZE_SMALL },
          end: { x: 405 + CROSS_SIZE_SMALL, y: 537 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 405 - CROSS_SIZE_SMALL, y: 537 + CROSS_SIZE_SMALL },
          end: { x: 405 + CROSS_SIZE_SMALL, y: 537 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }

      if (newspaper_id === "SUNDAY_ARUNA") {
        page.drawText(String(publish_date ?? ""), {
          x: 100,
          y: 715,
          size: 10,
          font: SINHALA_REGEX.test(publish_date) ? sinhalaFont : englishFont,
        });

        // draw background tint
        page.drawLine({
          start: { x: 100 - CROSS_SIZE_SMALL, y: 715 - CROSS_SIZE_SMALL },
          end: { x: 100 + CROSS_SIZE_SMALL, y: 715 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 100 - CROSS_SIZE_SMALL, y: 715 + CROSS_SIZE_SMALL },
          end: { x: 100 + CROSS_SIZE_SMALL, y: 715 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }
    }
    if (publisherName === "ceylon_newspapers") {
      //word count
      page.drawText(String(word_count ?? ""), {
        x: 122,
        y: 672,
        size: 10,
        font: SINHALA_REGEX.test(String(word_count))
          ? sinhalaFont
          : englishFont,
      });

      //category
      page.drawText(String(subcategory ?? ""), {
        x: 122,
        y: 695,
        size: 10,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });
      //receipt
      page.drawText(String(reference_number ?? ""), {
        x: 87,
        y: 647,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      if (ad_type === "photo_classified") {
        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 675 - CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 675 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 675 + CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 675 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      } else if (ad_type === "classified") {
        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 652 - CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 652 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 652 + CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 652 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }

      if (casual_ad?.no_of_boxes === 0 && casual_ad?.ad_size === "custom") {
        //h x w
        const height_form = casual_ad?.ad_height + " cm";
        const width_form = casual_ad?.no_of_columns + " col";
        page.drawText(String(height_form ?? ""), {
          x: 465,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(height_form))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(" x ", {
          x: 500,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });

        page.drawText(String(width_form ?? ""), {
          x: 530,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(width_form))
            ? sinhalaFont
            : englishFont,
        });
      } else if (casual_ad?.no_of_boxes > 0) {
        page.drawText("box ad: ", {
          x: 480,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });
        const box_form = casual_ad?.no_of_boxes + " boxes";
        page.drawText(String(box_form ?? ""), {
          x: 520,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(box_form))
            ? sinhalaFont
            : englishFont,
        });
      } else {
        page.drawText(String(casual_ad?.ad_size ?? ""), {
          x: 465,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
            ? sinhalaFont
            : englishFont,
        });
      }

      // draw cross color option
      if (casual_ad?.color_option === "full_color") {
        color_x = 547;
        color_y = 629;
      } else if (casual_ad?.color_option === "bw1") {
        color_x = 547;
        color_y = 657;
      } else if (casual_ad?.color_option === "bw2") {
        color_x = 409;
        color_y = 629;
      } else if (casual_ad?.color_option === "bw") {
        color_x = 409;
        color_y = 657;
      }

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL,
          y: color_y - CROSS_SIZE_SMALL,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL,
          y: color_y + CROSS_SIZE_SMALL,
        },
        thickness: 1,
      });

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL,
          y: color_y + CROSS_SIZE_SMALL,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL,
          y: color_y - CROSS_SIZE_SMALL,
        },
        thickness: 1,
      });

      // Normalize ad text based on agency.ad_text_type
      const normalizedText = normalizeAdText(
        advertisement_text,
        agency.ad_text_type,
      );

      // Get publisher-specific coordinates
      const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);

      const wordsToPrint = Math.min(
        normalizedText.length,
        MAX_WORDS,
        COLUMN_X.length * ROW_Y.length,
      );

      // Draw ad text
      for (let i = 0; i < wordsToPrint; i++) {
        const col = i % COLUMN_X.length;
        const row = Math.floor(i / COLUMN_X.length);
        if (row >= ROW_Y.length) break;

        const text = normalizedText[i];
        const fontToUse = SINHALA_REGEX.test(text) ? sinhalaFont : englishFont;

        page.drawText(text, {
          x: COLUMN_X[col],
          y: ROW_Y[row],
          size: 10,
          font: fontToUse,
        });
      }

      //advertiser details
      const formattedName = formatAdvertiserName(advertiser_name);
      page.drawText(String(formattedName), {
        x: 128,
        y: 173,
        size: 10,
        font: SINHALA_REGEX.test(String(formattedName))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_address ?? ""), {
        x: 128,
        y: 148,
        size: 10,
        font: SINHALA_REGEX.test(String(advertiser_address))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 93,
        y: 112,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 301,
        y: 110,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(getSignature(advertiser_name)), {
        x: 50,
        y: 68,
        size: 10,
        font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
          ? sinhalaFont
          : englishFont,
      });

      // Draw date
      const todayDate = getTodayYMD();
      page.drawText(String(todayDate ?? ""), {
        x: 161,
        y: 68,
        size: 10,
        font: SINHALA_REGEX.test(String(todayDate)) ? sinhalaFont : englishFont,
      });

      if (newspaper_id === "MAWBIMA") {
        page.drawLine({
          start: { x: 555 - CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          end: { x: 555 + CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 555 - CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          end: { x: 555 + CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      } else if (newspaper_id === "DAILY_MAWBIMA") {
        page.drawLine({
          start: { x: 494 - CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          end: { x: 494 + CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 494 - CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          end: { x: 494 + CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }
    }
    if (publisherName === "upali_newspapers") {
      if (newspaper_id === "SUNDAY_ISLAND") {
        page.drawText(String(publish_date ?? ""), {
          x: 190,
          y: 626,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (newspaper_id === "DAILY_DIVAINA") {
        page.drawText(String(publish_date ?? ""), {
          x: 190,
          y: 609,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (newspaper_id === "SUNDAY_DIVAINA") {
        page.drawText(String(publish_date ?? ""), {
          x: 190,
          y: 587,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (
        classified_ad?.is_int_bw ||
        classified_ad?.is_int_fc ||
        classified_ad?.is_int_highlight
      ) {
        page.drawText(String(publish_date ?? ""), {
          x: 190,
          y: 467,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (ad_type === "casual") {
        page.drawText(String(casual_ad?.ad_height ?? "") + "cm", {
          x: 195,
          y: 426,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.ad_height) + "cm")
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(" x ", {
          x: 220,
          y: 426,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });

        page.drawText(String(casual_ad?.no_of_columns ?? "") + "col", {
          x: 230,
          y: 426,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns) + "col")
            ? sinhalaFont
            : englishFont,
        });

        const color_opt = formatColorType(casual_ad?.color_option);
        page.drawText(String(color_opt ?? ""), {
          x: 195,
          y: 412,
          size: 8,
          font: SINHALA_REGEX.test(String(color_opt))
            ? sinhalaFont
            : englishFont,
        });
      }
      drawAdTextBlock(
        page,
        advertisement_text,
        70, // x
        378, // starting Y
        19, // line gap
        sinhalaFont,
        englishFont,
      );

      // Draw advertiser details
      const formattedName = formatAdvertiserName(advertiser_name);
      page.drawText(String(formattedName), {
        x: 60,
        y: 120,
        size: 10,
        font: SINHALA_REGEX.test(String(formattedName))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_address ?? ""), {
        x: 60,
        y: 83,
        size: 10,
        font: SINHALA_REGEX.test(String(advertiser_address))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 460,
        y: 103,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 460,
        y: 125,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(reference_number ?? ""), {
        x: 460,
        y: 88,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(getSignature(advertiser_name)), {
        x: 125,
        y: 30,
        size: 9,
        font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
          ? sinhalaFont
          : englishFont,
      });

      const todayDate = getTodayYMD();
      page.drawText(String(todayDate ?? ""), {
        x: 254,
        y: 30,
        size: 10,
        font: SINHALA_REGEX.test(String(todayDate)) ? sinhalaFont : englishFont,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
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
