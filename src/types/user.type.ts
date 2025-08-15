import { Role } from "@prisma/client";

export interface CreateUserDto {
  email: string;
  name: string;
  phone?: string;
  hash_password?: string;
  role: Role;
  image_url?: string;
  password: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  phone?: string;
  hash_password?: string;
  role?: Role;
  image_url?: string;
  password?: string;
}
