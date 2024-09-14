import { ShopOwnerRepository } from '../../../infrastructure/repositories/ShopOwnerRepository';
import logger from '../../../infrastructure/utils/logger';

const vendorRepo = new ShopOwnerRepository();

export async function validateDocumentsController(req, res) {
  try {
    const { vendorId } = req.params;
    const { documentStatus, message } = req.body;

    // Validate input
    if (!vendorId) {
      return res.status(400).json({ error: 'shopOwnerId is required' });
    }
    if (!documentStatus || typeof documentStatus !== 'object') {
      return res.status(400).json({ error: 'Invalid documentStatus' });
    }

    // Fetch the shop owner based on ID
    const vendor = await vendorRepo.getById(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Shop owner not found' });
    }

    // Check if all documents are approved
    const isVerified = Object.values(documentStatus).every(
      (status) => status === 'approved'
    );

    // console.log(documentStatus);

    const updatedDocuments = vendor.documents?.map((doc) => {
      // Check if document has a type and log the structure for debugging
      if (!doc.type) {
        logger.error('Document type missing for ' + doc.type);
        return doc; // Skip if type is missing
      }

      const newStatus = documentStatus[doc.type] || 'rejected';

      const { imageUrl, type } = doc;

      // If newStatus is found, update the document, otherwise return it as is
      if (newStatus) {
        return {
          imageUrl,
          type,
          status: newStatus === 'approved' ? 'approved' : 'rejected',
        };
      }

      return doc;
    });

    // Update the shop owner's information
    await vendorRepo.updateDocumentStatus({
      _id: vendorId,
      documents: updatedDocuments,
      isVerified, // Set verification status based on document approval
      message,
    });

    logger.debug('Updated shop owner:', vendorId);

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error validating vendor documents:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
