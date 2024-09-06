import { Request, Response } from 'express';
import { DeliveryPartnerRepository } from '../../../infrastructure/repositories/DeliveryPartnerRepository';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';

// Define the DocumentStatus interface
interface DocumentStatus {
  message: string;
  documentStatus: {
    aadhar: boolean;
    drivingLicense: boolean;
    pan: boolean;
    vehicle: boolean;
    emergencyContact: boolean;
    bankAccountDetails: boolean;
  };
}

// Build response with document status
function buildResponse(partner: IDeliveryPartner): DocumentStatus {
  const documentStatus = {
    aadhar: false,
    drivingLicense: false,
    pan: false,
    vehicle: false,
    emergencyContact: false,
    bankAccountDetails: false,
  };

  if (partner.documents) {
    Object.keys(partner.documents).forEach((key) => {
      if (key in documentStatus) {
        documentStatus[key] = partner.documents[key].status;
      }
    });
  }

  return {
    documentStatus,
    message: partner.message || 'Verification in progress',
  };
}

// Fetch document status for a partner
async function getDocumentStatus(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const partnerRepo = new DeliveryPartnerRepository();
    const partnerId = req.user?._id;
    const partner = await partnerRepo.getById(partnerId);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const response = buildResponse(partner);
    return res.json(response);
  } catch (error) {
    console.error('Error fetching document status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export { getDocumentStatus };
