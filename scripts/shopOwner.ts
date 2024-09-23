import { faker } from '@faker-js/faker';
import ShopOwner from '../src/infrastructure/database/models/ShopOwnerModel';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export const generateDummyShopOwners = async (count: number) => {
  const shopOwners = [];

  for (let i = 0; i < count; i++) {
    const email = faker.internet.email();
    const passwordHash = await hashPassword(email); // Await hashPassword

    const shopOwner = new ShopOwner({
      phone: faker.phone.number(),
      email,
      isVerified: true,
      documents: [
        {
          imageUrl: [faker.image.url(), faker.image.url()],
          type: faker.helpers.arrayElement([
            'aadhar',
            'pan',
            'driving-license',
          ]),
          status: faker.helpers.arrayElement([
            'pending',
            'approved',
            'rejected',
          ]),
        },
      ],
      bankDetails: {
        accountHolderName: faker.person.fullName(),
        accountNumber: faker.finance.accountNumber(),
        bankName: faker.company.name(),
        ifscCode: faker.finance.bic(),
      },
      authMethods: [
        {
          passwordHash, // Correctly assign the awaited hash
          provider: 'credential',
        },
      ],
      emailVerified: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      profile: {
        address: {
          city: faker.location.city(),
          country: faker.location.country(),
          postalCode: faker.location.zipCode(),
          state: faker.location.state(),
          street: faker.location.streetAddress(),
        },
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        avatar: faker.image.avatar(),
      },
      message: faker.lorem.sentence(),
    });

    shopOwners.push(shopOwner);
  }

  // Insert all the generated shop owners into MongoDB
  try {
    await ShopOwner.insertMany(shopOwners); // Removed second shopOwners declaration
    console.log(`${count} shop owners inserted successfully`);
    return shopOwners;
  } catch (error) {
    console.error('Error inserting shop owners:', error);
    return [];
  }
};
