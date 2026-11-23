import puppeteer, { PDFOptions } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================================================================
// HANDLEBARS HELPERS
// ====================================================================================

handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

handlebars.registerHelper('lookup', function (obj, key) {
  return obj && obj[key] !== undefined ? obj[key] : '';
});

handlebars.registerHelper('substr', function (str, start, len) {
  return (str || '').toString().substr(start, len).toUpperCase();
});

// ====================================================================================
// TEMPLATE CACHE
// ====================================================================================

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

const loadTemplate = (templateName: string): HandlebarsTemplateDelegate => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(__dirname, 'template', `${templateName}.html`);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const compiledTemplate = handlebars.compile(templateContent);

  templateCache.set(templateName, compiledTemplate);
  return compiledTemplate;
};

// ====================================================================================
// DEFAULT BRANDING
// ====================================================================================

const DEFAULT_BRANDING = {
  INSTITUTION_NAME: 'Nordi Remittance',
  TAGLINE: 'Digital Banking & Remittance',
  LOGO_URL: 'https://fhdzjrj.stripocdn.email/content/guids/CABINET_d682b1c5c3e6ca19c2b709cadb8e0af619ba854080ca1e19025c86180c64ecd0/images/top_logoremovebgpreview.png',
  PRIMARY_COLOR: '#0b5394',
  SECONDARY_COLOR: '#1e40af',
  ACCENT_COLOR: '#10b981',
  DANGER_COLOR: '#ef4444'
};

// ====================================================================================
// TYPES
// ====================================================================================

export interface PDFGenerationOptions {
  templateName?: string;
  data?: Record<string, any>;
  branding?: Record<string, any>;
  pdfOptions?: PDFOptions;
}

export interface AccountStatementOptions {
  user: Record<string, any>;
  account: Record<string, any>;
  transactions: any[];
  period: { from: Date; to: Date };
  branding?: Record<string, any>;
}

export interface TransactionReceiptOptions {
  transaction: Record<string, any>;
  user: Record<string, any>;
  branding?: Record<string, any>;
}

export interface LoanDocumentOptions {
  loan: Record<string, any>;
  user: Record<string, any>;
  schedule: any[];
  branding?: Record<string, any>;
}

// ====================================================================================
// PDF GENERATOR
// ====================================================================================

/**
 * Generate a PDF from an HTML template using Puppeteer
 */
export const generatePDFFromTemplate = async (options: PDFGenerationOptions): Promise<Buffer> => {
  const { templateName = 'pdf-base', data = {}, branding = {}, pdfOptions = {} } = options;

  const mergedBranding = { ...DEFAULT_BRANDING, ...branding };
  const referenceId = `NORDI-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const templateData = {
    ...data,
    ...mergedBranding,
    REFERENCE_ID: data.REFERENCE_ID || referenceId,
    GENERATED_DATE: data.GENERATED_DATE || generatedDate,
    PAGE_NUMBER: '{{page}}',
    TOTAL_PAGES: '{{pages}}'
  };

  const template = loadTemplate(templateName);
  const html = template(templateData);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // v22 format
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0']
    });

    const defaultPdfOptions: PDFOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; padding: 0 15mm; display: flex; justify-content: space-between; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <span style="color: #0b5394; font-weight: 600;">Nordi Remittance</span>
          <span>Digital Banking & Remittance</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    };

    const pdfBuffer = await page.pdf({
      ...defaultPdfOptions,
      ...pdfOptions
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// ====================================================================================
// ACCOUNT STATEMENT PDF
// ====================================================================================

export const generateAccountStatement = async (options: AccountStatementOptions): Promise<Buffer> => {
  const { user, account, transactions = [], period, branding = {} } = options;

  const totalIn = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOut = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = [
    { label: 'Opening Balance', value: `${account.currency} ${(account.balance - totalIn + totalOut).toFixed(2)}` },
    { label: 'Total Credits', value: `${account.currency} ${totalIn.toFixed(2)}`, class: 'success' },
    { label: 'Total Debits', value: `${account.currency} ${totalOut.toFixed(2)}`, class: 'danger' },
    { label: 'Closing Balance', value: `${account.currency} ${(account.balance || 0).toFixed(2)}`, class: 'primary' },
  ];

  const summary = [
    { label: 'Account Name', value: user.fullName || user.email },
    { label: 'Account Type', value: (account.type || 'Personal').toUpperCase() },
    { label: 'Account Number', value: account.accountNumber || '—' },
    { label: 'Statement Period', value: `${period.from.toLocaleDateString('en-GB')} – ${period.to.toLocaleDateString('en-GB')}` },
    { label: 'Currency', value: account.currency || 'USD' },
    { label: 'Status', value: account.status || 'Active', class: account.status === 'active' ? 'success' : 'warning' },
  ];

  const tableData = transactions.slice(0, 500).map(t => ({
    date: new Date(t.createdAt).toLocaleDateString('en-GB'),
    reference: t.reference || t._id?.toString().slice(-8),
    description: t.description || t.type,
    type: t.type?.toUpperCase(),
    amount: `${t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}`,
    balance: `${t.runningBalance ? t.runningBalance.toFixed(2) : '—'}`
  }));

  const tableColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Reference', key: 'reference' },
    { header: 'Description', key: 'description' },
    { header: 'Type', key: 'type' },
    { header: 'Amount', key: 'amount' },
    { header: 'Balance', key: 'balance' },
  ];

  return generatePDFFromTemplate({
    templateName: 'pdf-base',
    data: {
      DOCUMENT_TITLE: 'Account Statement',
      DOCUMENT_SUBTITLE: `For the period ending ${period.to.toLocaleDateString('en-GB')}`,
      SUMMARY: summary,
      SUMMARY_TITLE: 'Account Information',
      STATS: stats,
      TABLE_TITLE: 'Transaction History',
      TABLE_COLUMNS: tableColumns,
      TABLE_DATA: tableData,
      DOC_STATUS: 'Official Statement',
    },
    branding,
  });
};

// ====================================================================================
// TRANSACTION RECEIPT PDF
// ====================================================================================

export const generateTransactionReceipt = async (options: TransactionReceiptOptions): Promise<Buffer> => {
  const { transaction, user, branding = {} } = options;

  const summary = [
    { label: 'Transaction ID', value: transaction.reference || transaction._id?.toString() },
    { label: 'Date & Time', value: new Date(transaction.createdAt).toLocaleString('en-GB') },
    { label: 'Customer Name', value: user.fullName || user.email },
    { label: 'Account Number', value: transaction.accountNumber || '—' },
    { label: 'Type', value: (transaction.type || 'Transfer').toUpperCase() },
    { label: 'Amount', value: `${transaction.currency || 'USD'} ${(transaction.amount || 0).toFixed(2)}`, class: 'primary' },
  ];

  const infoBox = transaction.status === 'successful' || transaction.status === 'completed'
    ? { type: 'success', title: 'Transaction Successful', content: `This transaction has been successfully processed and verified.` }
    : { type: 'warning', title: `Transaction ${transaction.status}`, content: `This transaction is currently marked as ${transaction.status}.` };

  return generatePDFFromTemplate({
    templateName: 'pdf-base',
    data: {
      DOCUMENT_TITLE: 'Transaction Receipt',
      DOCUMENT_SUBTITLE: 'Electronic Transaction Record',
      REFERENCE_ID: transaction.reference,
      SUMMARY: summary,
      SUMMARY_TITLE: 'Transaction Details',
      INFO_BOX: infoBox,
      DOC_STATUS: transaction.status === 'successful' ? 'Verified' : 'Pending',
      SHOW_SIGNATURE: true,
      SIGNER1_NAME: 'Nordi Remittance',
      SIGNER1_TITLE: 'Digital Authorisation',
      SIGNER2_NAME: user.fullName || 'Customer',
      SIGNER2_TITLE: 'Account Holder',
    },
    branding,
  });
};

// ====================================================================================
// LOAN DOCUMENT PDF
// ====================================================================================

export const generateLoanDocument = async (options: LoanDocumentOptions): Promise<Buffer> => {
  const { loan, user, schedule = [], branding = {} } = options;

  const summary = [
    { label: 'Loan Reference', value: loan.reference || loan._id?.toString().slice(-8) },
    { label: 'Borrower Name', value: user.fullName || user.email },
    { label: 'Loan Amount', value: `${loan.currency || 'USD'} ${(loan.amount || 0).toFixed(2)}`, class: 'primary' },
    { label: 'Interest Rate', value: `${loan.interestRate || 0}%` },
    { label: 'Tenure', value: `${loan.tenure || 0} Months` },
    { label: 'Status', value: (loan.status || 'Active').toUpperCase(), class: loan.status === 'active' ? 'success' : 'warning' },
  ];

  const tableData = schedule.map(s => ({
    installment: s.installmentNumber,
    dueDate: new Date(s.dueDate).toLocaleDateString('en-GB'),
    principal: `${loan.currency || 'USD'} ${s.principal.toFixed(2)}`,
    interest: `${loan.currency || 'USD'} ${s.interest.toFixed(2)}`,
    total: `${loan.currency || 'USD'} ${s.total.toFixed(2)}`,
    status: s.status?.toUpperCase() || 'PENDING'
  }));

  const tableColumns = [
    { header: 'No.', key: 'installment' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Principal', key: 'principal' },
    { header: 'Interest', key: 'interest' },
    { header: 'Total Payment', key: 'total' },
    { header: 'Status', key: 'status' },
  ];

  return generatePDFFromTemplate({
    templateName: 'pdf-base',
    data: {
      DOCUMENT_TITLE: 'Loan Agreement & Schedule',
      DOCUMENT_SUBTITLE: 'Repayment Schedule and Terms',
      REFERENCE_ID: loan.reference,
      SUMMARY: summary,
      SUMMARY_TITLE: 'Loan Details',
      TABLE_TITLE: 'Repayment Schedule',
      TABLE_COLUMNS: tableColumns,
      TABLE_DATA: tableData,
      DOC_STATUS: 'Official Document',
      SHOW_SIGNATURE: true,
      SIGNER1_NAME: 'Nordi Remittance',
      SIGNER1_TITLE: 'Lending Operations',
      SIGNER2_NAME: user.fullName || 'Borrower',
      SIGNER2_TITLE: 'Acknowledged',
    },
    branding,
  });
};

export interface LoanDecisionPDFOptions {
  application: Record<string, any>;
  decision: 'approve' | 'reject';
  applicantName: string;
  sponsorName?: string;
  amount: number;
  requestedAmount: number;
  interestRate: number;
  defaultFeePercentage?: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  currency?: string;
  reason?: string;
  notes?: string;
  isThirdParty?: boolean;
  thirdPartyApplicant?: Record<string, any>;
  schedule?: any[];
}

/**
 * Pure-Node fallback PDF builder (%PDF-1.4) so PDF generation succeeds even if headless Chromium is unavailable.
 */
function buildFallbackLoanPDF(lines: string[], title: string): Buffer {
  const esc = (s: string) =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ' ');

  const textOps: string[] = [
    'BT',
    '/F1 16 Tf',
    '50 785 Td',
    `(${esc('NORDI REMITTANCE - OFFICIAL LOAN DECISION STATEMENT')}) Tj`,
    '/F1 12 Tf',
    '0 -22 Td',
    `(${esc(title)}) Tj`,
    '/F1 10 Tf',
    '0 -16 Td',
    `(${esc('--------------------------------------------------------------------------------')}) Tj`,
  ];

  for (const line of lines.slice(0, 42)) {
    textOps.push('0 -15 Td');
    textOps.push(`(${esc(line)}) Tj`);
  }
  textOps.push('ET');
  const streamContent = textOps.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export const generateLoanDecisionPDF = async (options: LoanDecisionPDFOptions): Promise<Buffer> => {
  const {
    application,
    decision,
    applicantName,
    sponsorName,
    amount,
    requestedAmount,
    interestRate,
    defaultFeePercentage = 2.5,
    termMonths,
    monthlyPayment,
    totalInterest,
    totalRepayment,
    currency = 'USD',
    reason,
    notes,
    isThirdParty = false,
    thirdPartyApplicant,
    schedule = [],
  } = options;

  const isApproved = decision === 'approve';
  const refId = application.applicationId || application._id?.toString() || `LN-${Date.now()}`;
  const decisionReason =
    reason ||
    notes ||
    (isApproved
      ? 'Approved following credit capacity, KYC verification, and financial ecosystem volume assessment.'
      : 'Application did not meet current credit underwriting or verification requirements.');

  const summary = [
    { label: 'Application Reference', value: refId },
    {
      label: 'Decision Status',
      value: isApproved ? 'APPROVED' : 'DECLINED / REJECTED',
      class: isApproved ? 'success' : 'danger',
    },
    { label: 'Applicant Name', value: applicantName },
    ...(isThirdParty && sponsorName
      ? [
          {
            label: 'Application Type',
            value: `Third-Party Sponsored (${thirdPartyApplicant?.relationshipToSponsor || 'Beneficiary'})`,
          },
          { label: 'Sponsoring Account Holder', value: sponsorName },
        ]
      : [{ label: 'Application Type', value: 'Primary Account Holder' }]),
    { label: 'Requested Amount', value: `${currency} ${Number(requestedAmount || amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    {
      label: isApproved ? 'Approved Loan Amount' : 'Evaluated Amount',
      value: `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      class: 'primary',
    },
    { label: 'Annual Interest Rate (APR)', value: `${interestRate}% p.a.` },
    { label: 'Default Penalty Fee Policy', value: `+${defaultFeePercentage}% per default` },
    { label: 'Loan Duration / Tenure', value: `${termMonths} Months` },
    {
      label: 'Minimum Monthly Requirement (EMI)',
      value: `${currency} ${Number(monthlyPayment).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Total Interest Payable',
      value: `${currency} ${Number(totalInterest).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Total Cumulative Repayment',
      value: `${currency} ${Number(totalRepayment).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    { label: 'Loan Purpose', value: application.purpose || 'Personal / Business Financing' },
    { label: 'Repayment Mode', value: 'Manual Repayment Only (Auto-Debit Disabled)' },
    { label: isApproved ? 'Approval Notes / Reason' : 'Reason for Rejection', value: decisionReason },
  ];

  const tableData = schedule.slice(0, 60).map((s: any, idx: number) => ({
    installment: s.installmentNumber || idx + 1,
    dueDate: s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-GB') : `Month ${idx + 1}`,
    principal: `${currency} ${Number(s.principalAmount ?? s.principal ?? amount / Math.max(1, termMonths)).toFixed(2)}`,
    interest: `${currency} ${Number(s.interestAmount ?? s.interest ?? totalInterest / Math.max(1, termMonths)).toFixed(2)}`,
    total: `${currency} ${Number(s.totalAmount ?? s.total ?? monthlyPayment).toFixed(2)}`,
    status: (s.status || 'SCHEDULED').toUpperCase(),
  }));

  try {
    return await generatePDFFromTemplate({
      templateName: 'pdf-base',
      data: {
        DOCUMENT_TITLE: isApproved ? 'Loan Approval & Terms Statement' : 'Loan Application Decision Notice',
        DOCUMENT_SUBTITLE: isThirdParty
          ? `Third-Party Sponsored Loan Application (${applicantName})`
          : `Official Credit Underwriting Decision`,
        REFERENCE_ID: refId,
        SUMMARY: summary,
        SUMMARY_TITLE: 'Loan Financial Summary & Decision Details',
        INFO_BOX: {
          type: isApproved ? 'success' : 'danger',
          title: isApproved ? 'Loan Application Approved' : 'Loan Application Declined',
          content: decisionReason,
        },
        ...(isApproved && tableData.length > 0
          ? {
              TABLE_TITLE: 'Monthly Repayment Schedule',
              TABLE_COLUMNS: [
                { header: 'No.', key: 'installment' },
                { header: 'Due Date', key: 'dueDate' },
                { header: 'Principal', key: 'principal' },
                { header: 'Interest', key: 'interest' },
                { header: 'Monthly Payment', key: 'total' },
                { header: 'Status', key: 'status' },
              ],
              TABLE_DATA: tableData,
            }
          : {}),
        DOC_STATUS: isApproved ? 'Approved' : 'Declined',
        SHOW_SIGNATURE: true,
        SIGNER1_NAME: 'Nordi Remittance Credit Committee',
        SIGNER1_TITLE: 'Lending & Underwriting Operations',
        SIGNER2_NAME: applicantName,
        SIGNER2_TITLE: isThirdParty ? 'Third-Party Borrower' : 'Account Holder',
      },
    });
  } catch (_err) {
    const lines = [
      `Decision Date: ${new Date().toUTCString()}`,
      `Application Reference: ${refId}`,
      `Decision Status: ${isApproved ? 'APPROVED' : 'DECLINED / REJECTED'}`,
      ...summary.map((s) => `${s.label}: ${s.value}`),
    ];
    return buildFallbackLoanPDF(
      lines,
      isApproved ? 'Loan Approval & Repayment Terms' : 'Loan Application Decision Notice',
    );
  }
};

export default {
  generatePDFFromTemplate,
  generateAccountStatement,
  generateTransactionReceipt,
  generateLoanDocument,
  generateLoanDecisionPDF,
};
