import { Injectable } from '@nestjs/common';
import { ShopService } from '../../modules/shop/shop.service';

@Injectable()
export class PdfService {
  constructor(private readonly shopService: ShopService) {}

  private getChargeableRentalDays(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }

  private formatCurrency(value: number) {
    return Number(value).toLocaleString('vi-VN');
  }

  private formatDateTime(value: Date) {
    return value.toLocaleString('vi-VN');
  }

  private getPaymentMethodLabel(order: any) {
    if (order.paymentStatus === 'DEPOSIT_PAID') {
      return 'Da thanh toan';
    }

    if (order.paymentStatus === 'REFUNDED') {
      return 'Da tat toan';
    }

    return 'Chua thanh toan';
  }

  private async renderReceiptPdf(html: string) {
    const { default: puppeteer } = (await new Function(
      'specifier',
      'return import(specifier)',
    )('puppeteer')) as typeof import('puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const contentHeight = await page.evaluate(() =>
        Math.ceil(document.documentElement.scrollHeight),
      );

      const pdfBuffer = await page.pdf({
        width: '80mm',
        height: `${Math.max(contentHeight + 16, 320)}px`,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private renderBaseHtml({
    title,
    subtitle,
    metaCode,
    order,
    body,
    footerLines,
    shop,
  }: {
    title: string;
    subtitle: string;
    metaCode: string;
    order: any;
    body: string;
    footerLines: string[];
    shop: {
      shopName: string;
      legalName?: string;
      hotline?: string;
      email?: string;
      address?: string;
      taxCode?: string;
    };
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 0;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #111111;
            font-family: "Courier New", monospace;
            font-size: 12px;
            line-height: 1.35;
          }

          .receipt {
            width: 80mm;
            box-sizing: border-box;
            padding: 12px 10px 16px;
          }

          .center {
            text-align: center;
          }

          .store-name {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .doc-title {
            margin-top: 8px;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .muted {
            color: #444444;
          }

          .rule {
            border-top: 1px dashed #111111;
            margin: 10px 0;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 4px 10px;
            margin-top: 8px;
          }

          .label {
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          th,
          td {
            padding: 4px 0;
            vertical-align: top;
          }

          th {
            border-bottom: 1px solid #111111;
            font-weight: 700;
            text-align: left;
          }

          .text-right {
            text-align: right;
          }

          .totals {
            margin-top: 8px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 2px 0;
          }

          .total-row.strong {
            font-weight: 700;
          }

          .footer-note {
            margin-top: 10px;
            text-align: center;
          }

          .qr-wrap {
            margin-top: 10px;
            text-align: center;
          }

          .qr-wrap img {
            width: 118px;
            height: 118px;
            object-fit: contain;
          }

          .small {
            font-size: 11px;
          }

          .spaced {
            letter-spacing: 0.04em;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            <div class="store-name">${shop.shopName}</div>
            ${shop.legalName ? `<div>${shop.legalName}</div>` : ''}
            ${shop.hotline ? `<div>Hotline: ${shop.hotline}</div>` : ''}
            ${shop.email ? `<div>${shop.email}</div>` : ''}
            ${shop.address ? `<div>${shop.address}</div>` : ''}
            ${shop.taxCode ? `<div>MST: ${shop.taxCode}</div>` : ''}
            <div class="doc-title">${title}</div>
            <div class="small muted">${subtitle}</div>
          </div>

          <div class="rule"></div>

          <div class="meta-grid">
            <div><span class="label">Ma don:</span> #${order.id}</div>
            <div>${metaCode}</div>
            <div><span class="label">Thoi gian:</span> ${this.formatDateTime(new Date(order.createdAt ?? new Date()))}</div>
            <div><span class="label">Trang thai:</span> ${order.status}</div>
            <div><span class="label">Khach hang:</span> ${order.renterFullName || 'Khach le'}</div>
            <div><span class="label">SĐT:</span> ${order.renterPhoneNumber || '---'}</div>
          </div>

          <div class="rule"></div>

          ${body}

          <div class="rule"></div>

          <div class="footer-note">
            ${footerLines.map((line) => `<div>${line}</div>`).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateInvoice(order: any): Promise<Buffer> {
    const shop = await this.shopService.getSettings();
    const rentalDays = this.getChargeableRentalDays(
      order.rentalStartDate,
      order.rentalEndDate,
    );
    const invoiceCode = `HD-${String(order.id).padStart(6, '0')}`;
    const body = `
      <div>
        <div><span class="label">Ky thue:</span> ${order.rentalStartDate} -> ${order.rentalEndDate}</div>
        <div><span class="label">So ngay tinh tien:</span> ${rentalDays} ngay</div>
        <div><span class="label">Thanh toan:</span> ${this.getPaymentMethodLabel(order)}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>San pham</th>
            <th class="text-right">SL</th>
            <th class="text-right">TT</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map((item: any) => {
              const lineTotal =
                Number(item.unitPrice) * Number(item.quantity) * rentalDays;

              return `
                <tr>
                  <td>
                    <div>${item.product?.name || 'N/A'}</div>
                    <div class="small muted">${this.formatCurrency(Number(item.unitPrice))}/ngay x ${rentalDays} ngay</div>
                  </td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${this.formatCurrency(lineTotal)}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Tam tinh</span>
          <span>${this.formatCurrency(Number(order.rentalPrice))}</span>
        </div>
        <div class="total-row">
          <span>Tien coc</span>
          <span>${this.formatCurrency(Number(order.depositAmount))}</span>
        </div>
        ${
          shop.bankName || shop.bankAccountNumber || shop.bankAccountName
            ? `
        <div class="total-row">
          <span>Thong tin CK</span>
          <span class="text-right">${[shop.bankName, shop.bankAccountNumber].filter(Boolean).join(' - ')}</span>
        </div>
        `
            : ''
        }
        <div class="total-row strong">
          <span>Khach phai tra</span>
          <span>${this.formatCurrency(
            Number(order.rentalPrice) + Number(order.depositAmount),
          )}</span>
        </div>
      </div>
    `;

    return this.renderReceiptPdf(
      this.renderBaseHtml({
        title: 'Hoa don thanh toan',
        subtitle: 'Phieu xac nhan don thue',
        metaCode: invoiceCode,
        order,
        body,
        footerLines: [
          'Da xac nhan thanh toan',
          shop.invoiceFooter || 'Cam on quy khach va hen gap lai',
        ],
        shop,
      }),
    );
  }

  async generateReceipt(order: any, refundAmount: number): Promise<Buffer> {
    const shop = await this.shopService.getSettings();
    const body = `
      <div>
        <div><span class="label">Ky thue:</span> ${order.rentalStartDate} -> ${order.rentalEndDate}</div>
        <div><span class="label">Tien thue da thu:</span> ${this.formatCurrency(Number(order.rentalPrice))}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Noi dung</th>
            <th class="text-right">So tien</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tien coc da thu</td>
            <td class="text-right">${this.formatCurrency(Number(order.depositAmount))}</td>
          </tr>
          <tr>
            <td>Tien phat</td>
            <td class="text-right">${this.formatCurrency(Number(order.penaltyAmount))}</td>
          </tr>
          <tr>
            <td>Hoan coc cho khach</td>
            <td class="text-right">${this.formatCurrency(refundAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row strong">
          <span>So tien hoan</span>
          <span>${this.formatCurrency(refundAmount)}</span>
        </div>
      </div>
    `;

    return this.renderReceiptPdf(
      this.renderBaseHtml({
        title: 'Bien nhan hoan coc',
        subtitle: 'Xac nhan khach da tra do',
        metaCode: `RC-${String(order.id).padStart(6, '0')}`,
        order,
        body,
        footerLines: [
          'Da tra do va tat toan don hang',
          shop.invoiceFooter || 'Cam on quy khach',
        ],
        shop,
      }),
    );
  }
}
