import { mockOf } from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked } from "vitest";

import { ConflictError } from "@/lib/custom-error";
import { UserRepository } from "@/repositories/user.repository";

import { UserService } from "./user.service";

describe("UserService.createUser", () => {
  let repo: Mocked<UserRepository>;
  let service: UserService;
  const input = { name: "Ada", email: "ada@x.io", password: "secret" };

  beforeEach(() => {
    repo = mockOf<UserRepository>();
    service = new UserService(repo);
  });

  it("creates a USER with name and email only", async () => {
    repo.findByEmail.mockResolvedValue(null as never);
    repo.create.mockResolvedValue({ id: "u1" } as never);

    await expect(service.createUser(input as never)).resolves.toEqual({
      id: "u1",
    });
    expect(repo.findByEmail).toHaveBeenCalledWith("ada@x.io");
    expect(repo.create).toHaveBeenCalledWith({
      data: { name: "Ada", email: "ada@x.io", role: "USER" },
    });
  });

  it("rejects a duplicate email", async () => {
    repo.findByEmail.mockResolvedValue({ id: "u0" } as never);

    await expect(service.createUser(input as never)).rejects.toBeInstanceOf(
      ConflictError
    );
    expect(repo.create).not.toHaveBeenCalled();
  });
});
