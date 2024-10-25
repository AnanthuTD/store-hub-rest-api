import { DeliveryPartnerRepository } from '../../../infrastructure/repositories/DeliveryPartnerRepository';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

export const extractDocumentInfo = (uploadedFiles) => {
  const documentInfo = {};

  uploadedFiles.forEach((file) => {
    const [documentType, side] = file.fieldname.split('_'); // Split the fieldname to get document type and side (front/back)

    if (!documentInfo[documentType]) {
      documentInfo[documentType] = {}; // Initialize the document type if not already present
    }

    if (side === 'front') {
      documentInfo[documentType].frontImage = file.path; // Assign front image path
    } else if (side === 'back') {
      documentInfo[documentType].backImage = file.path; // Assign back image path
    }
  });

  return documentInfo;
};

export async function uploadDocuments(req, res) {
  try {
    console.log('Received files:', req.files);

    const partnerId = getRequestUserId(req);

    const documentInfo = extractDocumentInfo(req.files);
    documentInfo.aadhar.status = 'pending';

    const partnerRepo = new DeliveryPartnerRepository();

    const partner = await partnerRepo.getById(partnerId);

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const existingDoc = partner?.documents;

    console.log({ ...existingDoc, ...documentInfo });

    await partnerRepo.update({
      _id: partnerId,
      documents: { ...existingDoc, ...documentInfo },
    });

    return res.status(200).json({ message: 'Documents uploaded successfully' });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
