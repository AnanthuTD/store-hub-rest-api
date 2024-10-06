import { io } from '../../../socket';
import socketKeys from '../../../socket/socketKeys';
import { IOrder } from '../../database/models/OrderSchema';

class StoreSocketService {
  private storeNamespace = io.of(socketKeys.storeNameSpace);
  private storeId: string;
  private storeRoom: string;

  constructor(storeId: string) {
    this.storeId = storeId;
    this.storeRoom = socketKeys.getStoreRoomKey(storeId);
  }

  notifyStoreOnOrder(order: IOrder) {
    this.storeNamespace
      .to(this.storeRoom)
      .emit(socketKeys.storeNewOrderEvent, order);
  }
}

export default StoreSocketService;
