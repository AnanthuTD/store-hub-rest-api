import { Request, Response } from 'express';
import { IShopOwner } from '../../../../domain/entities/IShopOwner';
import { setAuthTokenInCookies } from '../../../../infrastructure/auth/setAuthTokenInCookies';
import { VendorOwnerRepository } from '../../../../infrastructure/repositories/VendorRepository';
import TokenService from '../../../../infrastructure/services/TokenService';
import oauth2Client from '../../../../infrastructure/utils/oauth2client';
import axios from 'axios';

const googleAuth = async (req: Request, res: Response) => {
  const code = req.query.code;

  console.log('USER CREDENTIAL -> ', code);

  try {
    const googleRes = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(googleRes.tokens);

    const userResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const profile = userResponse.data;
    const vendorRepository = new VendorOwnerRepository();

    console.log(JSON.stringify(profile, null, 2));

    // Check if the user already exists by email
    let user = await vendorRepository.getByEmail(profile.email);
    if (!user) {
      const newUser: IShopOwner = {
        email: profile.emails?.[0].value || '',
        profile: {
          name: profile.name,
          firstName: profile.givenName,
          lastName: profile.familyName,
          address: {
            city: '',
            country: '',
            postalCode: '',
            state: '',
            street: '',
          },
          avatar: profile.picture || '',
        },
      };
      user = await vendorRepository.create(newUser);
    }

    // Generate a token for the user
    const token = TokenService.generateToken(user.id as string);

    console.log(user, token);

    // Set the token in cookies
    setAuthTokenInCookies(token, res);

    // Send the user data in the response
    res.json({ user });
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Axios error
      console.error('Error fetching user info:', error.response.data);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error instanceof Error) {
      // General error
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.error('Error generating token:', 'Unknown error');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export default googleAuth;
