import { Role } from "@/generated/client";
import { ConflictError } from "@/lib/custom-error";
import userRepository, { CreateUserDto } from "@/repositories/user.repository";

class UserService {
  async createUser(
    data: Omit<CreateUserDto, "hash_password"> & { password: string }
  ) {
    const { name, email } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    return userRepository.create({
      data: {
        name,
        email,
        role: Role.USER,
      },
    });
  }
}

export const userService = new UserService();
export default userService;
