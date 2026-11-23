import ExcelJS from "exceljs";

export interface StatementExportRow {
  date: string;
  reference: string;
  senderBank: string;
  type: string;
  purpose: string;
  amount: number;
  currency: string;
  status: string;
  balance?: number;
}

export interface StatementExportPayload {
  title: string;
  accountHolder: string;
  accountLabel: string;
  accountNumber: string;
  currency: string;
  periodLabel: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  rows: StatementExportRow[];
}

const escapePdfText = (input: string): string =>
  String(input || "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const truncate = (str: string, max: number) =>
  str.length > max ? `${str.slice(0, max - 1)}…` : str;

/**
 * Generates a valid multi-page PDF 1.4 document buffer with zero external browser/binary deps.
 */
export function buildStatementPdfBuffer(payload: StatementExportPayload): Buffer {
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const MARGIN_X = 36;
  const ROWS_PER_FIRST_PAGE = 26;
  const ROWS_PER_NEXT_PAGE = 34;

  const chunks: StatementExportRow[][] = [];
  if (payload.rows.length === 0) {
    chunks.push([]);
  } else {
    chunks.push(payload.rows.slice(0, ROWS_PER_FIRST_PAGE));
    let idx = ROWS_PER_FIRST_PAGE;
    while (idx < payload.rows.length) {
      chunks.push(payload.rows.slice(idx, idx + ROWS_PER_NEXT_PAGE));
      idx += ROWS_PER_NEXT_PAGE;
    }
  }

  const pageStreams: string[] = chunks.map((pageRows, pageIdx) => {
    const ops: string[] = [];
    let y = PAGE_HEIGHT - 44;

    if (pageIdx === 0) {
      // Brand header banner
      ops.push("0.145 0.388 0.922 rg");
      ops.push(`${MARGIN_X} ${y - 28} ${PAGE_WIDTH - MARGIN_X * 2} 38 re f`);
      ops.push("1 1 1 rg");
      ops.push("BT /F2 14 Tf");
      ops.push(`${MARGIN_X + 14} ${y - 13} Td (${escapePdfText("NORDI REMITTANCE")}) Tj ET`);
      ops.push("BT /F1 9 Tf");
      ops.push(`${PAGE_WIDTH - MARGIN_X - 155} ${y - 12} Td (${escapePdfText(payload.title)}) Tj ET`);

      y -= 52;
      ops.push("0.1 0.1 0.1 rg");
      ops.push(`BT /F2 10 Tf ${MARGIN_X} ${y} Td (${escapePdfText(`Account Holder: ${payload.accountHolder}`)}) Tj ET`);
      ops.push(`BT /F1 9 Tf ${PAGE_WIDTH - MARGIN_X - 190} ${y} Td (${escapePdfText(`Period: ${payload.periodLabel}`)}) Tj ET`);
      y -= 15;
      ops.push(`BT /F1 9 Tf ${MARGIN_X} ${y} Td (${escapePdfText(`Account: ${payload.accountLabel} (${payload.accountNumber})`)}) Tj ET`);
      ops.push(`BT /F1 9 Tf ${PAGE_WIDTH - MARGIN_X - 190} ${y} Td (${escapePdfText(`Generated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`)}) Tj ET`);

      y -= 24;
      ops.push("0.94 0.96 0.99 rg");
      ops.push(`${MARGIN_X} ${y - 14} ${PAGE_WIDTH - MARGIN_X * 2} 24 re f`);
      ops.push("0.15 0.15 0.15 rg");
      const summaryLine = `Opening: ${payload.currency} ${payload.openingBalance.toFixed(2)}   |   Credits: +${payload.totalCredits.toFixed(2)}   |   Debits: -${payload.totalDebits.toFixed(2)}   |   Closing: ${payload.currency} ${payload.closingBalance.toFixed(2)}`;
      ops.push(`BT /F2 8.5 Tf ${MARGIN_X + 8} ${y - 5} Td (${escapePdfText(summaryLine)}) Tj ET`);
      y -= 30;
    } else {
      ops.push("0.4 0.4 0.4 rg");
      ops.push(`BT /F1 8.5 Tf ${MARGIN_X} ${y} Td (${escapePdfText(`${payload.title} (Continued — Page ${pageIdx + 1})`)}) Tj ET`);
      y -= 22;
    }

    // Table header
    ops.push("0.91 0.93 0.96 rg");
    ops.push(`${MARGIN_X} ${y - 6} ${PAGE_WIDTH - MARGIN_X * 2} 18 re f`);
    ops.push("0.15 0.15 0.15 rg");
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 4} ${y} Td (Date) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 76} ${y} Td (Reference) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 162} ${y} Td (Sender Bank) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 248} ${y} Td (Type) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 312} ${y} Td (Purpose) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 422} ${y} Td (Amount) Tj ET`);
    ops.push(`BT /F2 8 Tf ${MARGIN_X + 486} ${y} Td (Status) Tj ET`);
    y -= 20;

    if (pageRows.length === 0) {
      ops.push("0.45 0.45 0.45 rg");
      ops.push(`BT /F1 9 Tf ${MARGIN_X + 4} ${y} Td (No transactions found for the selected period.) Tj ET`);
    } else {
      for (const row of pageRows) {
        ops.push("0.2 0.2 0.2 rg");
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 4} ${y} Td (${escapePdfText(truncate(row.date, 16))}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 76} ${y} Td (${escapePdfText(truncate(row.reference, 15))}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 162} ${y} Td (${escapePdfText(truncate(row.senderBank, 16))}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 248} ${y} Td (${escapePdfText(truncate(row.type, 11))}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 312} ${y} Td (${escapePdfText(truncate(row.purpose, 20))}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 422} ${y} Td (${escapePdfText(`${row.currency} ${Number(row.amount || 0).toFixed(2)}`)}) Tj ET`);
        ops.push(`BT /F1 7.5 Tf ${MARGIN_X + 486} ${y} Td (${escapePdfText(truncate(row.status, 10))}) Tj ET`);
        y -= 18;
      }
    }

    // Footer
    ops.push("0.5 0.5 0.5 rg");
    ops.push(
      `BT /F1 7.5 Tf ${MARGIN_X} 28 Td (${escapePdfText(`Nordi Digital Banking · Official Account Statement · Page ${pageIdx + 1} of ${chunks.length}`)}) Tj ET`,
    );

    return ops.join("\n");
  });

  // Assemble PDF objects
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  // 1: Catalog, 2: Pages, 3: Helvetica, 4: Helvetica-Bold
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(""); // placeholder for /Pages
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (const stream of pageStreams) {
    const contentId = objects.length + 1;
    const streamBytes = Buffer.byteLength(stream, "utf8");
    objects.push(`<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`);

    const pageId = objects.length + 1;
    pageObjectIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

export function buildStatementCsv(payload: StatementExportPayload): string {
  const headers = ["Date", "Reference", "Sender Bank", "Type", "Purpose", "Amount", "Currency", "Status"];
  const rows = payload.rows.map((r) => [
    `"${(r.date || "").replace(/"/g, '""')}"`,
    `"${(r.reference || "").replace(/"/g, '""')}"`,
    `"${(r.senderBank || "").replace(/"/g, '""')}"`,
    `"${(r.type || "").replace(/"/g, '""')}"`,
    `"${(r.purpose || "").replace(/"/g, '""')}"`,
    Number(r.amount || 0).toFixed(2),
    r.currency || payload.currency,
    r.status || "completed",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function buildStatementExcelBuffer(payload: StatementExportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Statement");

  sheet.addRow(["Nordi Remittance — Official Statement"]);
  sheet.addRow(["Account Holder", payload.accountHolder, "Account", `${payload.accountLabel} (${payload.accountNumber})`]);
  sheet.addRow(["Period", payload.periodLabel, "Currency", payload.currency]);
  sheet.addRow(["Opening Balance", payload.openingBalance, "Closing Balance", payload.closingBalance]);
  sheet.addRow([]);
  sheet.addRow(["Date", "Reference", "Sender Bank", "Type", "Purpose", "Amount", "Currency", "Status"]);

  for (const r of payload.rows) {
    sheet.addRow([r.date, r.reference, r.senderBank, r.type, r.purpose, Number(r.amount || 0), r.currency, r.status]);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

