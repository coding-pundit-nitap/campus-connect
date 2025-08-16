import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { User } from "@prisma/client";

export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      confirmPassword: string;
    }) => userAPIService.registerUser(data),
    onSuccess: (data: Pick<User, "id" | "email" | "name" | "role">) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      console.log("User registered successfully:", data);
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
}

export function useOptimisticUserUpdate() {
  const queryClient = useQueryClient();

  return {
    updateUserLocally: (userId: string, updates: Partial<User>) => {
      queryClient.setQueryData(
        queryKeys.users.profile(userId),
        (oldData: User | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
    },
    invalidateUser: (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(userId),
      });
    },
  };
}
