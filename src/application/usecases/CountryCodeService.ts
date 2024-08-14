interface CountryCode {
  code: string;
  country: string;
}

export const getCountryCodes = async (): Promise<CountryCode[]> => {
  return [
    { code: '+1', country: 'United States' },
    { code: '+91', country: 'India' },
  ];
};
