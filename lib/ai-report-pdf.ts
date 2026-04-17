import { GoogleGenAI, Type } from "@google/genai";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type AiNarrative = {
  title: string;
  executiveSummary: string;
  keyFindings: string[];
  wardHighlights: Array<{
    wardName: string;
    severity: string;
    summary: string;
  }>;
  recommendations: string[];
  conclusion: string;
};

type InputBundle = {
  project: any;
  analysis: any;
  report?: any | null;
};

function safeJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeForPrompt(bundle: InputBundle) {
  const wardScores = Array.isArray(bundle.analysis?.wardScores)
    ? bundle.analysis.wardScores.slice(0, 12).map((ward: any) => ({
        wardName: ward.wardName,
        severity: ward.severity,
        priorityScore: ward.priorityScore,
        confidence: ward.confidence,
        topDeficits: ward.topDeficits,
        actualScores: ward.actualScores,
        benchmarkTargets: ward.benchmarkTargets,
        recommendedActions: ward.recommendedActions,
      }))
    : [];

  const interventions = Array.isArray(bundle.analysis?.priorityInterventions)
    ? bundle.analysis.priorityInterventions.slice(0, 8)
    : [];

  return {
    project: {
      name: bundle.project?.name,
      city: bundle.project?.city,
      state: bundle.project?.state,
      country: bundle.project?.country,
      benchmarkProfile: bundle.project?.benchmarkProfile,
      status: bundle.project?.status,
    },
    globalSummary: bundle.analysis?.globalSummary || null,
    wardScores,
    priorityInterventions: interventions,
    existingReport: bundle.report || null,
  };
}

export async function generateAiNarrative(bundle: InputBundle): Promise<AiNarrative> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const promptPayload = normalizeForPrompt(bundle);

  const prompt = `
You are an expert civic infrastructure analyst writing a concise, professional municipal assessment report.

Use only the supplied JSON data.
Do not invent wards, metrics, or programs.
Write clearly for hackathon judges, municipal officers, and non-technical stakeholders.

Return JSON matching the schema exactly.

DATA:
${JSON.stringify(promptPayload)}
  `.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
          },
          executiveSummary: {
            type: Type.STRING,
          },
          keyFindings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          wardHighlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                wardName: { type: Type.STRING },
                severity: { type: Type.STRING },
                summary: { type: Type.STRING },
              },
              required: ["wardName", "severity", "summary"],
            },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          conclusion: {
            type: Type.STRING,
          },
        },
        required: [
          "title",
          "executiveSummary",
          "keyFindings",
          "wardHighlights",
          "recommendations",
          "conclusion",
        ],
      },
    },
  });

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error("Gemini returned an empty report response");
  }

  return JSON.parse(raw) as AiNarrative;
}

function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(next, fontSize);

    if (width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildAiPdf(bundle: InputBundle) {
  const narrative = await generateAiNarrative(bundle);

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 48;
  const topY = 790;
  const bottomY = 52;
  const maxWidth = pageWidth - marginX * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = topY;

  const ensureSpace = (needed = 20) => {
    if (y - needed < bottomY) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = topY;
    }
  };

  const drawLine = (text: string, size = 11, color = rgb(0.1, 0.1, 0.1), isBold = false) => {
    ensureSpace(size + 6);
    page.drawText(text, {
      x: marginX,
      y,
      size,
      font: isBold ? bold : regular,
      color,
    });
    y -= size + 6;
  };

  const drawParagraph = (text: string, size = 11, color = rgb(0.15, 0.15, 0.15)) => {
    const lines = wrapText(text, maxWidth, regular, size);
    for (const line of lines) {
      ensureSpace(size + 5);
      page.drawText(line, {
        x: marginX,
        y,
        size,
        font: regular,
        color,
      });
      y -= size + 5;
    }
    y -= 6;
  };

  const drawBulletList = (items: string[], size = 11) => {
    for (const item of items) {
      const bulletWidth = 14;
      const lines = wrapText(item, maxWidth - bulletWidth, regular, size);

      for (let i = 0; i < lines.length; i++) {
        ensureSpace(size + 5);
        page.drawText(i === 0 ? "•" : "", {
          x: marginX,
          y,
          size,
          font: bold,
          color: rgb(0.12, 0.12, 0.12),
        });
        page.drawText(lines[i], {
          x: marginX + bulletWidth,
          y,
          size,
          font: regular,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= size + 5;
      }
      y -= 3;
    }
    y -= 4;
  };

  const drawSectionTitle = (title: string) => {
    y -= 6;
    drawLine(title, 15, rgb(0.05, 0.18, 0.36), true);
  };

  drawLine(narrative.title || `${bundle.project?.name || "Project"} AI Report`, 22, rgb(0.05, 0.18, 0.36), true);
  drawLine(
    `${bundle.project?.city || ""}, ${bundle.project?.state || ""}, ${bundle.project?.country || ""}`.replace(/^,\s*|,\s*$/g, ""),
    11,
    rgb(0.35, 0.35, 0.35)
  );
  drawLine(
    `Generated on ${new Date().toLocaleString()}`,
    10,
    rgb(0.45, 0.45, 0.45)
  );

  y -= 8;
  drawSectionTitle("Executive Summary");
  drawParagraph(narrative.executiveSummary);

  drawSectionTitle("Key Findings");
  drawBulletList(narrative.keyFindings || []);

  drawSectionTitle("Project Snapshot");
  drawParagraph(
    `Total wards: ${bundle.analysis?.globalSummary?.totalWards ?? "--"} | Critical: ${bundle.analysis?.globalSummary?.criticalWards ?? "--"} | High: ${bundle.analysis?.globalSummary?.highWards ?? "--"} | Average Priority Score: ${bundle.analysis?.globalSummary?.averagePriorityScore ?? "--"}`
  );

  const avgScores = bundle.analysis?.globalSummary?.averageServiceScores || {};
  drawParagraph(
    `Average service scores — Water: ${avgScores.water ?? "--"}, Sanitation: ${avgScores.sanitation ?? "--"}, Electricity: ${avgScores.electricity ?? "--"}, Road: ${avgScores.road ?? "--"}, Drainage: ${avgScores.drainage ?? "--"}, Waste: ${avgScores.waste ?? "--"}`
  );

  drawSectionTitle("Ward Highlights");
  for (const ward of narrative.wardHighlights || []) {
    ensureSpace(64);
    drawLine(`${ward.wardName} • ${String(ward.severity || "").toUpperCase()}`, 12, rgb(0.12, 0.12, 0.12), true);
    drawParagraph(ward.summary, 10.5);
  }

  drawSectionTitle("Priority Recommendations");
  drawBulletList(narrative.recommendations || []);

  drawSectionTitle("Conclusion");
  drawParagraph(narrative.conclusion);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export function sanitizeFilename(input: string) {
  return String(input || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toPlainSafe(value: any) {
  return safeJson(value);
}