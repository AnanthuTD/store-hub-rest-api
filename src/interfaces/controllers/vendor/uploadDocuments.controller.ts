import { Request, Response } from 'express';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { deleteFromS3, s3Client } from '../../../infrastructure/s3Client';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

// Multer S3 setup for handling file uploads to S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'storehub',
    // acl: 'private',
    key: function (req, file, cb) {
      const uniqueFileName = `${Date.now().toString()}_${file.originalname}`;
      cb(null, uniqueFileName);
    },
  }),
}).fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'drivingLicenseFront', maxCount: 1 },
  { name: 'drivingLicenseBack', maxCount: 1 },
]);

// Extract the key (filename) from an S3 URL
function extractKey(url: string): string {
  return url.split('/').pop()!;
}

// Controller to upload, delete old files, and save new document URLs
export default async function uploadDocuments(req: Request, res: Response) {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Error uploading files:', err);
      return res
        .status(500)
        .json({ message: 'Error uploading files', error: err });
    }

    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    }; // Cast req.files to expected MulterS3 format

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      // Fetch existing shop owner document data
      const shopOwnerRepo = new VendorOwnerRepository();
      const shopOwner = await shopOwnerRepo.findById(getRequestUserId(req)); // Assuming getRequestUserId(req) holds the shop owner's ID

      if (!shopOwner) {
        return res.status(404).json({ message: 'Shop owner not found' });
      }

      // Delete existing S3 files
      const existingDocuments = shopOwner.documents || [];
      for (const doc of existingDocuments) {
        if (doc.imageUrl) {
          for (const key of doc.imageUrl) {
            await deleteFromS3('storehub', key); // Delete each existing file from S3
          }
        }
      }

      // Collect the new S3 URLs for each document type
      const uploadedFiles: { [key: string]: string } = {};
      Object.keys(files).forEach((key) => {
        uploadedFiles[key] = files[key][0].location; // S3 URL
      });

      // Structure the document data as required for storage
      const formattedDoc = [
        {
          imageUrl: [
            extractKey(uploadedFiles.aadharFront),
            extractKey(uploadedFiles.aadharBack),
          ],
          type: 'aadhar',
        },
        {
          imageUrl: [extractKey(uploadedFiles.panCard)],
          type: 'pan',
        },
        {
          imageUrl: [
            extractKey(uploadedFiles.drivingLicenseFront),
            extractKey(uploadedFiles.drivingLicenseBack),
          ],
          type: 'drivingLicense',
        },
      ];

      // Update the ShopOwner's documents in the database
      await shopOwnerRepo.update(getRequestUserId(req), {
        documents: formattedDoc,
      });

      res.status(200).json({
        message: 'Documents updated and uploaded successfully',
        files: uploadedFiles, // Return the new S3 URLs of the uploaded files
      });
    } catch (error) {
      console.error('Error while processing files:', error);
      res.status(500).json({
        message: 'Failed to update and upload documents',
        error: (error as Error).message,
      });
    }
  });
}
