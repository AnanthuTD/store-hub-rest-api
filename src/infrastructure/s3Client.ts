import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Helper function to delete an object from S3
export async function deleteFromS3(bucket: string, key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting file ${key} from S3:`, error);
    throw new Error(`Failed to delete file: ${key}`);
  }
}

// Helper function to get a presigned URL for an object in S3
export async function getPresignedUrl(
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn }); // Expires in 1 hour
}

// Helper function to upload an object to S3
export async function uploadToS3(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType: string
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    console.log(`File ${key} uploaded successfully.`);
  } catch (error) {
    console.error(`Error uploading file ${key} to S3:`, error);
    throw new Error(`Failed to upload file: ${key}`);
  }
}
