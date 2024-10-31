import { Request, Response } from 'express';

import axios from 'axios';
import oauth2Client from '../../../infrastructure/utils/oauth2client';
import { AdminRepository } from '../../../infrastructure/repositories/AdminRepository';
import TokenService from '../../../infrastructure/services/TokenService';
import { setAuthTokenInCookies } from '../../../infrastructure/auth/setAuthTokenInCookies';
import logger from '../../../infrastructure/utils/logger';

const googleAuth = async (req: Request, res: Response) => {
  const code = req.query.code;

  try {
    const googleRes = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(googleRes.tokens);

    const userResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const profile = userResponse.data;
    const adminRepository = new AdminRepository();

    // Check if the user already exists by email
    const user = await adminRepository.findByEmail(profile.emails[0].value);
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Admin does not exit', user: null });
    }

    // Generate a token for the user
    const token = TokenService.generateToken(user._id as string);

    // Set the token in cookies
    setAuthTokenInCookies(token, res);

    // Send the user data in the response
    res.json({ user });
  } catch (error) {
    if (error.response) {
      logger.error('Error fetching user info:', error.response.data);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error instanceof Error) {
      logger.error('Error generating token:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      logger.error('Error generating token:', 'Unknown error');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export default googleAuth;
