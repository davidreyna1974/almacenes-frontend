export interface UserPayload {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}
