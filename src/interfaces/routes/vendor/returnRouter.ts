import { Router } from 'express';
import { returnController } from '../../controllers/returnController';

const returnRouter = Router();

// Route for completing a return
returnRouter.post('/accept-return', returnController.completeReturnController);

returnRouter.get(
  '/return-requested-items',
  returnController.getReturnRequestedItems
);

returnRouter.get('/returned', returnController.getReturnedItems);

export default returnRouter;
