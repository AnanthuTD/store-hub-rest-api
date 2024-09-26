// for adding popularity field in storeProducts

import { faker } from '@faker-js/faker';
import Shop from '../src/infrastructure/database/models/ShopSchema';

Shop.updateMany({}, { $set: { rating: faker.number.int({ min: 1, max: 5 }) } });
