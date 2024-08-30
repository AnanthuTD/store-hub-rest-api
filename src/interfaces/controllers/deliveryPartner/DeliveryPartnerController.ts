import { Request, Response } from 'express';
import CreateDeliveryPartner from '../../../application/usecases/CreateDeliveryPartner';
import { deliveryPartnerPersonalSchema } from '../../../validators/deliveryPartner';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';

class DeliveryPartnerController {
  async signup(req: Request, res: Response) {
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
      ? req.files.find((file) => file.fieldname === 'avatar').path
      : null;

    // First, validate the form data
    const result = deliveryPartnerPersonalSchema.safeParse(formData);

    if (!result.success) {
      return res.status(400).json({ message: result.error.errors });
    }

    console.log(result.data);

    const response = await createDeliveryPartner.execute(
      result.data as IDeliveryPartner
    );

    if (response.success) {
      res.status(201).json(response.data);
    } else {
      res.status(400).json({ message: response.message });
    }
  }
}

export default new DeliveryPartnerController();
