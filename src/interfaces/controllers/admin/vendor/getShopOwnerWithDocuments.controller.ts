import { Request, Response } from 'express';
import { VendorOwnerRepository } from '../../../../infrastructure/repositories/VendorRepository';
import { getPresignedUrl } from '../../../../infrastructure/s3Client';
import env from '../../../../infrastructure/env/env';

export default async function getShopOwnerWithDocuments(
  req: Request,
  res: Response
) {
  try {
    const shopOwnerId = req.params.vendorId; // Assuming you get the shop owner ID from the URL params

    const vendorRepo = new VendorOwnerRepository();
    const vendor = await vendorRepo.findById(shopOwnerId);

    if (!vendor) {
      return res.status(404).json({ message: 'Shop owner not found' });
    }

    // Generate pre-signed URLs for documents
    const documents = vendor.documents || [];
    const bucketName = env.S3_BUCKET_NAME; // Replace with your actual bucket name

    const updatedDocuments = await Promise.all(
      documents.map(async (doc) => {
        if (!doc.imageUrl || !Array.isArray(doc.imageUrl)) {
          return { ...doc, imageUrl: [] }; // Handle case where imageUrl is null or not an array
        }

        const urls = await Promise.all(
          doc.imageUrl.map(async (fileKey: string) => {
            if (!fileKey) return null; // Check if fileKey is null or undefined
            const signedUrl = await getPresignedUrl(bucketName, fileKey);
            return signedUrl;
          })
        );

        return {
          ...doc,
          imageUrl: urls.filter(Boolean), // Filter out any null values from invalid fileKeys
        };
      })
    );

    // Return shop owner data with pre-signed URLs for documents
    const responseData = {
      ...vendor,
      documents: updatedDocuments,
    };

    res.status(200).json({
      message: 'Shop owner data retrieved successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('Error retrieving shop owner with documents:', error);
    res.status(500).json({
      message: 'Failed to retrieve shop owner data',
      error: (error as Error).message,
    });
  }
}
