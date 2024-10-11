import { Router } from 'express';
import { returnController } from '../../controllers/returnController';

const refundRouter = Router();

// Route for requesting a return
refundRouter.post('/request', returnController.requestReturnController);

export default refundRouter;
