import { Request, Response } from 'express';
import CreateDeliveryPartner from '../../../../application/usecases/CreateDeliveryPartner';
import { deliveryPartnerPersonalSchema } from '../../../../validators/deliveryPartner';
import { container } from '../../../../config/inversify.config';
import { TYPES } from '../../../../config/types';
import { IDeliveryPartner } from '../../../../domain/entities/DeliveryPartner';

class DeliveryPartnerController {
  async signup(req: Request, res: Response) {
    try {
      const createDeliveryPartner = container.get<CreateDeliveryPartner>(
        TYPES.CreateDeliveryPartner
      );

      // Process files and other form data
      const formData: IDeliveryPartner = {
        ...req.body,
        dob: new Date(req.body.dob),
      };

      type DocumentKeys = 'aadhar' | 'pan' | 'drivingLicense' | 'avatar';

      const personalDocs: DocumentKeys[] = ['aadhar', 'pan', 'drivingLicense'];

      personalDocs.forEach((doc) => {
        const frontImageFile = req.files
          ? req.files.find(
              (file) => file.fieldname === `documents[${doc}][frontImage]`
            )
          : null;
        const backImageFile = req.files
          ? req.files.find(
              (file) => file.fieldname === `documents[${doc}][backImage]`
            )
          : null;

        formData.documents[doc] = {
          frontImage: frontImageFile ? frontImageFile.path : null,
          backImage: backImageFile ? backImageFile.path : null,
        };
      });

      formData.avatar = req.files
        ? req.files.find((file) => file.fieldname === 'avatar')?.path || null
        : null;

      // First, validate the form data
      const result = deliveryPartnerPersonalSchema.safeParse(formData);

      if (!result.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: result.error.errors.map((error) => ({
            path: error.path.join('.'),
            message: error.message,
          })),
        });
      }

      console.log(result.data);

      // Execute the use case
      const response = await createDeliveryPartner.execute(
        result.data as IDeliveryPartner
      );

      if (response.success) {
        return res.status(201).json(response.data);
      } else {
        return res.status(400).json({ message: response.message });
      }
    } catch (error) {
      console.error('Error during signup:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: 'An unexpected error occurred',
          error: error.message,
        });
      }

      return res.status(500).json({
        message: 'An unknown error occurred',
      });
    }
  }
}

export default new DeliveryPartnerController();
