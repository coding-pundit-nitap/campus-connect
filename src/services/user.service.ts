import { Role } from "@prisma/client";

import { hashPassword } from "@/lib/auth";
import { ConflictError } from "@/lib/custom-error";
import userRepository, { CreateUserDto } from "@/repositories/user.repository";

class UserService {
  async createUser(
    data: Omit<CreateUserDto, "hash_password"> & { password: string }
  ) {
    const { name, email, password } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    const hashedPassword = await hashPassword(password);

    return userRepository.create({
      data: {
        name,
        email,
        hash_password: hashedPassword,
        role: Role.USER,
      },
    });
  }
}

export const userService = new UserService();
export default userService;
