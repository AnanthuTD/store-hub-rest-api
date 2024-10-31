import axios from 'axios';
import oauth2Client from '../../../infrastructure/utils/oauth2client';
import UserRepository from '../../../infrastructure/repositories/UserRepository';
import TokenService from '../../../infrastructure/services/TokenService';
import { setAuthTokenInCookies } from '../../../infrastructure/auth/setAuthTokenInCookies';
import logger from '../../../infrastructure/utils/logger';
import { IUser } from '../../../domain/entities/User';
import { Request, Response } from 'express';
import { IUserDocument } from '../../../infrastructure/database/models/UserSchema';

const googleAuth = async (req: Request, res: Response) => {
  const code = req.query.code;

  try {
    const googleRes = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(googleRes.tokens);

    const userResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const profile = userResponse.data;
    const userRepository = new UserRepository();

    // Check if the user already exists by email
    let user = (await userRepository.getUserByEmail(
      profile.email
    )) as unknown as IUserDocument;
    if (!user) {
      // Create a new user if not found
      const newUser: IUser = {
        email: profile.email || '',
        profile: {
          firstName: profile.given_name,
          lastName: profile.family_name,
          avatar: profile.picture,
        },
        password: '',
        walletBalance: 0,
      };
      user = (await userRepository.create(newUser)) as IUserDocument;
    }

    // Generate a token for the user
    const token = TokenService.generateToken(user._id as string);

    // Set the token in cookies
    setAuthTokenInCookies(token, res);

    // Send the user data in the response
    res.json({ user });
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Axios error
      logger.error('Error fetching user info:', error.response.data);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error instanceof Error) {
      // General error
      logger.error('Error generating token:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      logger.error('Error generating token:', 'Unknown error');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export default googleAuth;
