export type UserSessionErrorCode = 'CURRENT_USER_REQUIRED';

export class UserSessionError extends Error {
  constructor(
    public readonly code: UserSessionErrorCode,
    message = 'É necessário selecionar um usuário antes de continuar.',
  ) {
    super(message);
    this.name = 'UserSessionError';
  }
}
