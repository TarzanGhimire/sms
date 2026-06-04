import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { formatBs, billingPeriodBs } from '../common/utils/nepali-date';

// pdfkit is a CommonJS module without a usable ESM default export under
// NestJS's CJS interop, so require it directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

type Doc = any;

const PRIMARY = '#1e40af';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  /** Embed a base64 PNG/JPEG logo (data URL) at the top-right. SVG/others skipped. */
  private drawLogo(doc: Doc, logoUrl?: string) {
    if (!logoUrl) return;
    const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(logoUrl);
    if (!match) return; // pdfkit can't embed SVG/WEBP — skip silently
    try {
      const buffer = Buffer.from(match[2], 'base64');
      doc.image(buffer, 470, 45, { fit: [75, 75], align: 'right' });
    } catch {
      // never let a bad image break the document
    }
  }

  private async getSchool() {
    const s = await this.prisma.schoolSettings.findFirst();
    return {
      name: s?.schoolName ?? 'My School',
      address: s?.address ?? '',
      phone: s?.phone ?? '',
      email: s?.email ?? '',
      invoiceFooter: s?.invoiceFooter ?? '',
      receiptFooter: s?.receiptFooter ?? '',
      primary: s?.primaryColor ?? PRIMARY,
      logoUrl: s?.logoUrl ?? '',
    };
  }

  private money(n: number): string {
    return 'Rs. ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  private fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** Nepali BS date with the AD equivalent in parentheses, e.g. "7 Jestha 2083 BS (20 May 2026)". */
  private fmtDateBs(d: Date | string | null | undefined): string {
    if (!d) return '-';
    return `${formatBs(d)} BS  (${this.fmtDate(d)})`;
  }

  private startDoc(res: Response, filename: string): Doc {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    return doc;
  }

  private header(doc: Doc, school: { name: string; address: string; phone: string; email: string; primary: string; logoUrl?: string }, docTitle: string) {
    // Draw the uploaded logo (top-right) if it's an embeddable PNG/JPEG data URL.
    this.drawLogo(doc, school.logoUrl);

    doc.fillColor(school.primary || PRIMARY).font('Helvetica-Bold').fontSize(20).text(school.name, 50, 50, { width: 380 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9);
    const lines = [school.address, [school.phone, school.email].filter(Boolean).join(' | ')].filter(Boolean);
    lines.forEach((l) => doc.text(l, { width: 380 }));
    doc.moveDown(0.5);
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14).text(docTitle, 50, doc.y, { align: 'right' });
    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor(BORDER).stroke();
    doc.moveDown(1);
  }

  private kvRow(doc: Doc, label: string, value: string, x: number, y: number, width = 240) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x, y, { width });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(value, x, y + 12, { width });
  }

  /** Simple fixed-column table. cols = [{label,width,align}]. */
  private table(
    doc: Doc,
    cols: { label: string; width: number; align?: 'left' | 'right' }[],
    rows: string[][],
  ) {
    const startX = 50;
    let y = doc.y;
    const rowH = 22;

    // header
    doc.rect(startX, y, 495, rowH).fill('#f3f4f6');
    let x = startX + 8;
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
    cols.forEach((c) => {
      doc.text(c.label, x, y + 7, { width: c.width - 12, align: c.align ?? 'left' });
      x += c.width;
    });
    y += rowH;

    // body
    doc.font('Helvetica').fontSize(9).fillColor('#111827');
    rows.forEach((row) => {
      x = startX + 8;
      row.forEach((cell, i) => {
        doc.fillColor('#111827').text(cell, x, y + 7, { width: cols[i].width - 12, align: cols[i].align ?? 'left' });
        x += cols[i].width;
      });
      doc.moveTo(startX, y + rowH).lineTo(startX + 495, y + rowH).strokeColor(BORDER).stroke();
      y += rowH;
    });
    doc.y = y + 6;
  }

  // ─── INVOICE ────────────────────────────────────────────────────────────────
  async invoice(res: Response, inv: any) {
    const school = await this.getSchool();
    const doc = this.startDoc(res, `${inv.invoiceNumber}.pdf`);
    this.header(doc, school, 'INVOICE');

    const topY = doc.y;
    const cls = inv.student.section ? `${inv.student.section.class.name} - ${inv.student.section.name}` : '-';
    // left column
    this.kvRow(doc, 'Invoice Number', inv.invoiceNumber, 50, topY);
    this.kvRow(doc, 'Invoice Date', this.fmtDateBs(inv.createdAt), 50, topY + 34);
    this.kvRow(doc, 'Due Date', this.fmtDateBs(inv.dueDate), 50, topY + 68);
    // right column
    this.kvRow(doc, 'Bill To', `${inv.student.firstName} ${inv.student.lastName} (${inv.student.studentId})`, 310, topY);
    this.kvRow(doc, 'Class', cls, 310, topY + 34);
    this.kvRow(doc, 'Billing Period', `${billingPeriodBs(inv.billingMonth, inv.billingYear)} BS  (${this.monthName(inv.billingMonth)} ${inv.billingYear})`, 310, topY + 68);
    doc.y = topY + 104;
    doc.moveDown(0.5);

    this.table(
      doc,
      [
        { label: 'Description', width: 295 },
        { label: 'Amount', width: 100, align: 'right' },
        { label: 'Net', width: 100, align: 'right' },
      ],
      (inv.items ?? []).map((it: any) => [
        it.description,
        this.money(it.amount),
        this.money(it.netAmount),
      ]),
    );

    // totals
    const tx = 345;
    const totalsRow = (label: string, val: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(bold ? '#111827' : MUTED);
      doc.text(label, tx, doc.y, { width: 100, continued: false });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#111827')
        .text(val, tx + 100, doc.y - 12, { width: 100, align: 'right' });
      doc.moveDown(0.3);
    };
    doc.moveDown(0.5);
    totalsRow('Subtotal', this.money(inv.subtotal));
    if (inv.discountAmount > 0) totalsRow('Discount', '- ' + this.money(inv.discountAmount));
    if (inv.fineAmount > 0) totalsRow('Fine', '+ ' + this.money(inv.fineAmount));
    totalsRow('Total', this.money(inv.totalAmount), true);
    totalsRow('Paid', this.money(inv.paidAmount));
    totalsRow('Amount Due', this.money(inv.dueAmount), true);

    this.footer(doc, school.invoiceFooter || 'This is a computer-generated invoice.');
    doc.end();
  }

  // ─── RECEIPT ────────────────────────────────────────────────────────────────
  async receipt(res: Response, p: any) {
    const school = await this.getSchool();
    const doc = this.startDoc(res, `${p.receiptNumber}.pdf`);
    this.header(doc, school, 'PAYMENT RECEIPT');

    const topY = doc.y;
    this.kvRow(doc, 'Receipt Number', p.receiptNumber, 50, topY);
    this.kvRow(doc, 'Payment Date', this.fmtDateBs(p.paidAt ?? p.createdAt), 50, topY + 32);
    this.kvRow(doc, 'Received From', `${p.invoice.student.firstName} ${p.invoice.student.lastName} (${p.invoice.student.studentId})`, 310, topY);
    this.kvRow(doc, 'Against Invoice', p.invoice.invoiceNumber, 310, topY + 32);
    doc.y = topY + 70;
    doc.moveDown(1);

    this.table(
      doc,
      [
        { label: 'Description', width: 295 },
        { label: 'Method', width: 100 },
        { label: 'Amount', width: 100, align: 'right' },
      ],
      [[
        `Payment for ${this.monthName(p.invoice.billingMonth)} ${p.invoice.billingYear}`,
        this.methodLabel(p.method),
        this.money(p.amount),
      ]],
    );

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827')
      .text(`Amount Received: ${this.money(p.amount)}`, 50, doc.y, { align: 'right' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text(`Remaining Due on Invoice: ${this.money(p.invoice.dueAmount)}`, 50, doc.y, { align: 'right' });

    this.footer(doc, school.receiptFooter || 'Thank you for your payment.');
    doc.end();
  }

  // ─── REPORT CARD ──────────────────────────────────────────────────────────────
  async reportCard(res: Response, card: any) {
    const school = await this.getSchool();
    const doc = this.startDoc(res, `report-card-${card.student.studentId}.pdf`);
    this.header(doc, school, 'REPORT CARD');

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11)
      .text(`${card.exam.name}  (${card.exam.academicYear})`, 50, doc.y);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
      .text(`Issued: ${this.fmtDateBs(new Date())}`, 50, doc.y + 2);
    doc.moveDown(1);

    const topY = doc.y;
    this.kvRow(doc, 'Student', `${card.student.firstName} ${card.student.lastName}`, 50, topY);
    this.kvRow(doc, 'Student ID', card.student.studentId, 50, topY + 32);
    this.kvRow(doc, 'Class', `${card.student.className} - ${card.student.sectionName}`, 310, topY);
    this.kvRow(doc, 'Guardian', card.student.guardian ?? '-', 310, topY + 32);
    doc.y = topY + 70;
    doc.moveDown(0.5);

    this.table(
      doc,
      [
        { label: 'Subject', width: 195 },
        { label: 'Full', width: 70, align: 'right' },
        { label: 'Pass', width: 70, align: 'right' },
        { label: 'Obtained', width: 80, align: 'right' },
        { label: 'Grade', width: 80, align: 'right' },
      ],
      (card.subjects ?? []).map((s: any) => [
        s.name,
        String(s.fullMarks),
        String(s.passMarks),
        s.isAbsent ? 'ABS' : String(s.obtained),
        s.grade ?? '-',
      ]),
    );

    doc.moveDown(0.5);
    const sumY = doc.y;
    this.kvRow(doc, 'Total', `${card.totalObtained} / ${card.totalFull}`, 50, sumY, 120);
    this.kvRow(doc, 'Percentage', `${card.percentage}%`, 170, sumY, 120);
    this.kvRow(doc, 'GPA', card.gpa.toFixed(2), 290, sumY, 100);
    this.kvRow(doc, 'Grade', card.overallGrade, 390, sumY, 70);
    this.kvRow(doc, 'Rank', card.rank ? `${card.rank} / ${card.totalStudents}` : '-', 460, sumY, 80);
    doc.y = sumY + 36;
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(card.result === 'PASS' ? '#16a34a' : '#dc2626')
      .text(`Result: ${card.result}`, 50, doc.y);

    // signatures
    doc.moveDown(4);
    const sy = doc.y;
    ['Class Teacher', 'Principal', 'Date'].forEach((label, i) => {
      const x = 50 + i * 170;
      doc.moveTo(x, sy).lineTo(x + 140, sy).strokeColor(BORDER).stroke();
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x, sy + 4, { width: 140, align: 'center' });
    });

    doc.end();
  }

  private footer(doc: Doc, text: string) {
    const y = 780;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(text, 50, y + 6, { width: 495, align: 'center' });
  }

  private monthName(m: number): string {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] ?? '';
  }

  private methodLabel(m: string): string {
    return { CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', ESEWA: 'eSewa', KHALTI: 'Khalti' }[m] ?? m;
  }
}
