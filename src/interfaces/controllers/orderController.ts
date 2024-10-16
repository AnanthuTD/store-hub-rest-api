import { Request, Response } from 'express';
import { OrderRepository } from '../../infrastructure/repositories/orderRepository';
import {
  emitStoreStatusUpdateToDeliveryPartner,
  emitStoreStatusUpdateToUser,
} from '../../infrastructure/events/orderEvents';
import { OrderStoreStatus } from '../../infrastructure/database/models/OrderSchema';
import { VendorOwnerRepository } from '../../infrastructure/repositories/VendorRepository';
import Shop from '../../infrastructure/database/models/ShopSchema';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Readable } from 'node:stream';

export class OrderController {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async getStoreStatusValues(req: Request, res: Response) {
    const values = await this.orderRepo.getStoreStatusValues();
    return res.status(200).json(values);
  }

  async updateStoreStatus(req: Request, res: Response) {
    const { orderId, otp } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID and OTP are required' });
    }

    try {
      const result = await this.orderRepo.updateStoreStatus(orderId, otp);

      if (result.success && result.status) {
        // If the status update is successful
        res.status(200).json({
          message: result.message,
          storeStatus: result.status,
        });

        // Push notifications to user and delivery partner
        emitStoreStatusUpdateToUser(orderId, result.status);
        emitStoreStatusUpdateToDeliveryPartner(orderId, result.status);

        if (result.status === OrderStoreStatus.Collected && result.storeId) {
          const store = await Shop.findById(result.storeId, { ownerId: 1 });
          new VendorOwnerRepository().creditMoneyToWallet(
            result.storeAmount,
            store?.ownerId
          );
        }
      } else {
        // If there's an issue, return the failure message
        return res.status(400).json({
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getStoreStatus(req: Request, res: Response) {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    try {
      const status = await this.orderRepo.getCurrentStoreStatus(orderId);

      if (status !== null) {
        return res.status(200).json({ orderId, status });
      } else {
        return res.status(404).json({ message: 'Order not found' });
      }
    } catch (error) {
      console.error('Error retrieving order status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Generate invoice and send it as a PDF
  downloadInvoice = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    try {
      const order = await this.orderRepo.findOrderById(orderId);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { height } = page.getSize();

      // Fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const titleFontSize = 18;
      const headerFontSize = 14;
      const textFontSize = 12;

      // Title
      page.drawText('StoreHub Tax Invoice', {
        x: 200,
        y: height - 50,
        size: titleFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Order Details
      page.drawText(`Order ID: ${order._id}`, {
        x: 50,
        y: height - 100,
        size: textFontSize,
        font: helveticaFont,
      });

      page.drawText(`Order Date: ${order.orderDate.toDateString()}`, {
        x: 50,
        y: height - 120,
        size: textFontSize,
        font: helveticaFont,
      });

      page.drawText(`Invoice Date: ${new Date().toDateString()}`, {
        x: 50,
        y: height - 140,
        size: textFontSize,
        font: helveticaFont,
      });

      // Table Header
      const tableHeaderY = height - 180;
      page.drawText('Description', {
        x: 50,
        y: tableHeaderY,
        size: headerFontSize,
        font: helveticaFont,
      });
      page.drawText('Qty', {
        x: 350,
        y: tableHeaderY,
        size: headerFontSize,
        font: helveticaFont,
      });
      page.drawText('Price', {
        x: 400,
        y: tableHeaderY,
        size: headerFontSize,
        font: helveticaFont,
      });
      page.drawText('Total', {
        x: 450,
        y: tableHeaderY,
        size: headerFontSize,
        font: helveticaFont,
      });

      // Draw a horizontal line
      page.drawLine({
        start: { x: 50, y: tableHeaderY - 5 },
        end: { x: 550, y: tableHeaderY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Loop through order items
      const itemStartY = tableHeaderY - 20;
      order.items.forEach((item, index) => {
        const yPosition = itemStartY - index * 20;

        page.drawText(item.productName, {
          x: 50,
          y: yPosition,
          size: textFontSize,
          font: helveticaFont,
        });
        page.drawText(item.quantity.toString(), {
          x: 350,
          y: yPosition,
          size: textFontSize,
          font: helveticaFont,
        });
        page.drawText(item.price.toFixed(2), {
          x: 400,
          y: yPosition,
          size: textFontSize,
          font: helveticaFont,
        });
        page.drawText((item.price * item.quantity).toFixed(2), {
          x: 450,
          y: yPosition,
          size: textFontSize,
          font: helveticaFont,
        });
      });

      // Grand Total Calculation
      const subtotal = order.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      const deliveryCharges = order.deliveryFee || 0; // Assuming deliveryCharges is part of the order
      const platformFee = order.platformFee || 0; // Assuming platformFee is part of the order

      // Draw totals
      page.drawText(`Subtotal: Rs ${subtotal.toFixed(2)}`, {
        x: 400,
        y: itemStartY - order.items.length * 20 - 40,
        size: textFontSize,
        font: helveticaFont,
      });
      page.drawText(`Delivery Charges: Rs ${deliveryCharges.toFixed(2)}`, {
        x: 400,
        y: itemStartY - order.items.length * 20 - 60,
        size: textFontSize,
        font: helveticaFont,
      });
      page.drawText(`Platform Fee: Rs ${platformFee.toFixed(2)}`, {
        x: 400,
        y: itemStartY - order.items.length * 20 - 80,
        size: textFontSize,
        font: helveticaFont,
      });

      // Grand Total
      const grandTotal = order.totalAmount;
      page.drawText(`Grand Total: Rs ${grandTotal.toFixed(2)}`, {
        x: 400,
        y: itemStartY - order.items.length * 20 - 100,
        size: titleFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Send the PDF as a response
      const pdfStream = new Readable();
      pdfStream.push(pdfBytes);
      pdfStream.push(null); // Signal the end of the stream

      // Send the PDF as a stream
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice-${orderId}.pdf`
      );

      // Pipe the stream to the response
      pdfStream.pipe(res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error generating invoice' });
    }
  };
}
