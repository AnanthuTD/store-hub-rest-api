import express from 'express';
import { DeliveryPartnerRepository } from '../../../infrastructure/repositories/DeliveryPartnerRepository';
import logger from '../../../infrastructure/utils/logger';
import path from 'node:path';
import getShopOwnerWithDocuments from '../../controllers/admin/getShopOwnerWithDocuments.controller';
const adminRouter = express.Router();

const deliveryPartnerRepo = new DeliveryPartnerRepository();

console.log(
  path.join(
    'C:/Users/anant/OneDrive/Desktop/Brocamp/StoreHub/server/',
    'uploads/partner'
  )
);

adminRouter.use(
  '/document/uploads/partner/',
  express.static(
    path.join(
      'C:/Users/anant/OneDrive/Desktop/Brocamp/StoreHub/server/',
      'uploads/partner'
    )
  )
);

adminRouter.get('/list/not-verified', async (req, res) => {
  const notVerifiedPartners = await deliveryPartnerRepo.getNotVerified();
  console.log(notVerifiedPartners);
  return res.json(notVerifiedPartners);
});

adminRouter.get('/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;

    // Validate partnerId
    if (!partnerId) {
      return res.status(400).json({ error: 'partnerId is required' });
    }

    const deliveryPartner = await deliveryPartnerRepo.getById(partnerId);

    if (!deliveryPartner) {
      return res.status(404).json({ error: 'Delivery partner not found' });
    }

    return res.json(deliveryPartner);
  } catch (error) {
    logger.error('Error fetching delivery partner:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

adminRouter.post('/:deliveryPartnerId/validateDocuments', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { documentStatus, message } = req.body;

    // Validate input
    if (!deliveryPartnerId) {
      return res.status(400).json({ error: 'deliveryPartnerId is required' });
    }
    if (!documentStatus || typeof documentStatus !== 'object') {
      return res.status(400).json({ error: 'Invalid documentStatus' });
    }

    const deliveryPartner =
      await deliveryPartnerRepo.getById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({ error: 'Delivery partner not found' });
    }

    const isVerified = Object.values(documentStatus).every(
      (status) => status === 'approved'
    );

    const updatedDocuments = { ...deliveryPartner.documents };

    Object.keys(updatedDocuments).forEach((key) => {
      if (documentStatus[key]) {
        updatedDocuments[key].status =
          documentStatus[key] === 'approved' ? 'approved' : 'rejected';
      }
    });

    await deliveryPartnerRepo.update({
      _id: deliveryPartnerId,
      documents: updatedDocuments,
      isVerified,
      message,
    });

    logger.debug('Updated delivery partner:');

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error validating documents:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

adminRouter.get('/vendor/:id', getShopOwnerWithDocuments);

export default adminRouter;
