import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { User } from "@prisma/client";
import { loginAction } from "@/actions/authentication/login-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Hook to handle user registration with form validation, mutation management, and automatic cache invalidation.
 *
 * This hook provides a complete user registration flow including form submission,
 * server-side validation, success/error handling, and automatic cache management.
 * It's designed for registration forms, sign-up pages, and user onboarding flows.
 *
 * @returns UseMutationResult for user registration with form data and response handling
 *
 * @example
 * ```typescript
 * // Basic registration form
 * function RegistrationForm() {
 *   const registerUser = useRegisterUser();
 *   const [formData, setFormData] = useState({
 *     name: '',
 *     email: '',
 *     password: '',
 *     confirmPassword: ''
 *   });
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     registerUser.mutate(formData);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         type="text"
 *         placeholder="Name"
 *         value={formData.name}
 *         onChange={(e) => setFormData({...formData, name: e.target.value})}
 *       />
 *       <input
 *         type="email"
 *         placeholder="Email"
 *         value={formData.email}
 *         onChange={(e) => setFormData({...formData, email: e.target.value})}
 *       />
 *       <input
 *         type="password"
 *         placeholder="Password"
 *         value={formData.password}
 *         onChange={(e) => setFormData({...formData, password: e.target.value})}
 *       />
 *       <input
 *         type="password"
 *         placeholder="Confirm Password"
 *         value={formData.confirmPassword}
 *         onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
 *       />
 *       <button type="submit" disabled={registerUser.isPending}>
 *         {registerUser.isPending ? 'Registering...' : 'Register'}
 *       </button>
 *     </form>
 *   );
 * }
 *
 * // Advanced registration with validation
 * function AdvancedRegistrationForm() {
 *   const registerUser = useRegisterUser();
 *   const [errors, setErrors] = useState<string[]>([]);
 *
 *   const handleRegister = async (formData: RegistrationData) => {
 *     try {
 *       await registerUser.mutateAsync(formData);
 *       // Redirect to login page or dashboard
 *       router.push('/login');
 *     } catch (error) {
 *       setErrors(['Registration failed. Please try again.']);
 *     }
 *   };
 *
 *   return (
 *     <div className="registration-form">
 *       <FormValidation onSubmit={handleRegister} />
 *       {errors.length > 0 && <ErrorDisplay errors={errors} />}
 *       <LoadingSpinner visible={registerUser.isPending} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link userAPIService.registerUser} for the underlying API call
 * @see {@link useLoginUser} for user authentication after registration
 * @see {@link queryKeys.users.all} for cache key management
 *
 * @since 1.0.0
 */
export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      confirmPassword: string;
    }) => userAPIService.registerUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      toast.success("Registration successful! Please log in.");
    },
    onError: (error) => {
      toast.error("Registration failed: " + error.message);
    },
  });
}

/**
 * Hook to handle user authentication with credential validation, session management, and navigation.
 *
 * This hook provides a complete user login flow including credential submission,
 * authentication processing, success/error handling, automatic navigation, and
 * session management. It's designed for login forms, authentication pages, and
 * protected route access flows.
 *
 * @returns UseMutationResult for user login with credential data and session handling
 *
 * @example
 * ```typescript
 * // Basic login form
 * function LoginForm() {
 *   const loginUser = useLoginUser();
 *   const [credentials, setCredentials] = useState({
 *     email: '',
 *     password: ''
 *   });
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     loginUser.mutate(credentials);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         type="email"
 *         placeholder="Email"
 *         value={credentials.email}
 *         onChange={(e) => setCredentials({...credentials, email: e.target.value})}
 *       />
 *       <input
 *         type="password"
 *         placeholder="Password"
 *         value={credentials.password}
 *         onChange={(e) => setCredentials({...credentials, password: e.target.value})}
 *       />
 *       <button type="submit" disabled={loginUser.isPending}>
 *         {loginUser.isPending ? 'Logging in...' : 'Login'}
 *       </button>
 *       {loginUser.error && (
 *         <div className="error">
 *           Login failed: {loginUser.error.message}
 *         </div>
 *       )}
 *     </form>
 *   );
 * }
 *
 * // Login with remember me and forgot password
 * function AdvancedLoginForm() {
 *   const loginUser = useLoginUser();
 *   const [rememberMe, setRememberMe] = useState(false);
 *
 *   const handleLogin = async (credentials: LoginCredentials) => {
 *     try {
 *       await loginUser.mutateAsync({
 *         ...credentials,
 *         rememberMe
 *       });
 *       // Navigation handled automatically
 *     } catch (error) {
 *       // Error handling via toast
 *       console.error('Login failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <div className="login-form">
 *       <CredentialForm onSubmit={handleLogin} />
 *       <RememberMeCheckbox
 *         checked={rememberMe}
 *         onChange={setRememberMe}
 *       />
 *       <ForgotPasswordLink />
 *       <LoadingOverlay visible={loginUser.isPending} />
 *     </div>
 *   );
 * }
 *
 * // Conditional login for protected routes
 * function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
 *   const loginUser = useLoginUser();
 *   const { user, isLoading } = useCurrentUser();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!user) return <LoginPrompt onLogin={loginUser.mutate} />;
 *
 *   return <>{children}</>;
 * }
 * ```
 *
 * @see {@link loginAction} for the underlying authentication action
 * @see {@link useRegisterUser} for user registration flow
 * @see {@link queryKeys.users.all} for cache invalidation strategy
 *
 * @since 1.0.0
 */
export function useLoginUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      loginAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
      toast.success(data.details);
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Login failed: " + error.message);
    },
  });
}

/**
 * Hook to provide optimistic user data updates with local cache management and server synchronization.
 *
 * This hook enables immediate UI updates for user data changes while maintaining
 * data consistency through cache management and server synchronization. It's designed
 * for profile editing, user preferences, and any scenario requiring responsive user
 * data updates without waiting for server round-trips.
 *
 * @returns Object containing functions for local user updates and cache invalidation
 *
 * @example
 * ```typescript
 * // Profile editing with optimistic updates
 * function UserProfileEditor({ userId }: { userId: string }) {
 *   const { updateUserLocally, invalidateUser } = useOptimisticUserUpdate();
 *   const updateProfile = useUpdateUserProfile();
 *   const [isEditing, setIsEditing] = useState(false);
 *
 *   const handleProfileUpdate = async (updates: Partial<User>) => {
 *     // Optimistically update the UI immediately
 *     updateUserLocally(userId, updates);
 *     setIsEditing(false);
 *
 *     try {
 *       // Send the update to the server
 *       await updateProfile.mutateAsync({ userId, updates });
 *     } catch (error) {
 *       // Revert optimistic update on failure
 *       invalidateUser(userId);
 *       setIsEditing(true);
 *       toast.error('Failed to update profile');
 *     }
 *   };
 *
 *   return (
 *     <div className="profile-editor">
 *       <ProfileForm
 *         onSubmit={handleProfileUpdate}
 *         optimisticMode={true}
 *       />
 *       <SaveStatus pending={updateProfile.isPending} />
 *     </div>
 *   );
 * }
 *
 * // Real-time user status updates
 * function UserStatusIndicator({ userId }: { userId: string }) {
 *   const { updateUserLocally } = useOptimisticUserUpdate();
 *   const { data: user } = useUser(userId);
 *
 *   const handleStatusChange = (newStatus: UserStatus) => {
 *     // Immediately update UI
 *     updateUserLocally(userId, { status: newStatus, lastSeen: new Date() });
 *
 *     // Background sync with server
 *     updateUserStatus.mutate({ userId, status: newStatus });
 *   };
 *
 *   return (
 *     <div className="user-status">
 *       <StatusIndicator status={user?.status} />
 *       <StatusSelector onStatusChange={handleStatusChange} />
 *     </div>
 *   );
 * }
 *
 * // Batch user updates with rollback
 * function UserBatchEditor({ userIds }: { userIds: string[] }) {
 *   const { updateUserLocally, invalidateUser } = useOptimisticUserUpdate();
 *   const batchUpdate = useBatchUpdateUsers();
 *
 *   const handleBatchUpdate = async (updates: Partial<User>) => {
 *     // Optimistically update all users
 *     const rollbackFunctions = userIds.map(userId => {
 *       updateUserLocally(userId, updates);
 *       return () => invalidateUser(userId);
 *     });
 *
 *     try {
 *       await batchUpdate.mutateAsync({ userIds, updates });
 *     } catch (error) {
 *       // Rollback all optimistic updates
 *       rollbackFunctions.forEach(rollback => rollback());
 *       toast.error('Batch update failed');
 *     }
 *   };
 *
 *   return (
 *     <BatchUpdateForm
 *       onSubmit={handleBatchUpdate}
 *       userCount={userIds.length}
 *     />
 *   );
 * }
 * ```
 *
 * @see {@link queryKeys.users.profile} for user-specific cache keys
 * @see {@link useUser} for user data fetching
 * @see {@link useUpdateUserProfile} for server-side user updates
 *
 * @since 1.0.0
 */
export function useOptimisticUserUpdate() {
  const queryClient = useQueryClient();

  return {
    updateUserLocally: (user_id: string, updates: Partial<User>) => {
      queryClient.setQueryData(
        queryKeys.users.profile(user_id),
        (oldData: User | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        },
      );
    },
    invalidateUser: (user_id: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(user_id),
      });
    },
  };
}
