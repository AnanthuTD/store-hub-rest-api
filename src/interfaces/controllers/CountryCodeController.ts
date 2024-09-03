import { Request, Response } from 'express';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';
import logger from '../../infrastructure/utils/Logger';

export const fetchCountryCodes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const countryCodes = await getCountryCodes();
    res.status(200).json(countryCodes);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch country codes' });
  }
};
