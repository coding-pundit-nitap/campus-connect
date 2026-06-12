import { Role } from "@/generated/client";
import { ConflictError } from "@/lib/custom-error";
import { CreateUserDto, UserRepository } from "@/repositories/user.repository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(
    data: Omit<CreateUserDto, "hash_password"> & { password: string }
  ) {
    const { name, email } = data;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    return this.userRepository.create({
      data: {
        name,
        email,
        role: Role.USER,
      },
    });
  }
}
