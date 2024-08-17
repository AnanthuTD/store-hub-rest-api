export class InvalidCountryCodeError extends Error {
  constructor() {
    super('Invalid country code.');
    this.name = 'InvalidCountryCodeError';
  }
}
