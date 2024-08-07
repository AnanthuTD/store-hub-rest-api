export interface IRegisterUser {
  execute(email: string, password: string): Promise<IUser>;
}
