export interface UserResponse {
  id: number;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}
