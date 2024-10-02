import express from 'express';
import { updateDeliveryPartnerController } from '../../controllers/deliveryPartner/location/updateDeliveryPartnerLocation.controller';
import { getNearbyDeliveryPartnersController } from '../../controllers/deliveryPartner/location/getNearbyDeliveryPartner.controller';

const locationRoutes = express.Router();

locationRoutes.post('/add', updateDeliveryPartnerController);

locationRoutes.get('/nearby', getNearbyDeliveryPartnersController);

export default locationRoutes;
