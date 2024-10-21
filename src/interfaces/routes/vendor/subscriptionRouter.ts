import express from 'express';
import { RazorpayService } from '../../../infrastructure/services/RazorpayService';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import env from '../../../infrastructure/env/env';
const subscriptionRouter = express.Router();

subscriptionRouter.post('/subscribe', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendorData = await new VendorOwnerRepository().findById(vendorId);
    if (!vendorData) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Code for subscribing the user to a plan
    const response = await new RazorpayService().subscribe({
      notify_email: vendorData.email,
      notify_phone: vendorData.phone,
    });

    console.log(response);

    const subData = await new VendorOwnerRepository().createVendorSubscription(
      vendorId,
      response
    );

    return res.json({ ...subData, razorpayKeyId: env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
});

subscriptionRouter.get('/', async (req, res) => {
  try {
    const vendorId = req.user._id;
    let subscriptions = await new VendorOwnerRepository()
      .getVendorSubscription(vendorId)
      .lean();

    subscriptions = subscriptions.map((sub) => ({
      ...sub,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    }));

    return res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

subscriptionRouter.post('/payment-success', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { razorpay_payment_id } = req.body;
    console.log(req.body);

    const paymentDetails = await new RazorpayService().fetchPaymentInfo(
      razorpay_payment_id
    );

    if (!paymentDetails) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    console.log(paymentDetails);

    /*  const verifyPayment = await new RazorpayService().verifyPayment({
      razorpayOrderId: paymentDetails.order_id,
      razorpayPaymentId: req.body.razorpay_payment_id,
      razorpaySignature: req.body.razorpay_signature,
    });

    console.log(verifyPayment); */

    if (paymentDetails?.status === 'captured') {
      await new VendorOwnerRepository().updateSubscriptionStatusToActive(
        vendorId
      );
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
});

/* subscriptionRouter.post('/webhook', (req, res) => {
  const data = req.body;

  console.log(data);
}); */

export default subscriptionRouter;
