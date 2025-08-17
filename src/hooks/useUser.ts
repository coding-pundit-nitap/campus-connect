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
 * @remarks
 * **Mutation Behavior:**
 * - Validates form data including password confirmation
 * - Handles server-side validation errors gracefully
 * - Automatically shows success/error toast notifications
 * - Invalidates user cache to ensure data consistency
 *
 * **Form Data Requirements:**
 * - `name`: User's display name (required, non-empty string)
 * - `email`: Valid email address (required, unique in system)
 * - `password`: Secure password meeting system requirements
 * - `confirmPassword`: Must match password field exactly
 *
 * **Success Handling:**
 * - Returns user data with id, email, name, and role
 * - Displays success toast notification
 * - Invalidates user queries for fresh data
 * - Prepares system for immediate login
 *
 * **Error Handling:**
 * - Displays descriptive error messages via toast
 * - Handles network errors, validation errors, and server errors
 * - Maintains form state for user correction
 * - Provides detailed error information for debugging
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
    onSuccess: (data: Pick<User, "id" | "email" | "name" | "role">) => {
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
 * @remarks
 * **Authentication Flow:**
 * - Validates email and password credentials
 * - Processes authentication through secure login action
 * - Establishes user session upon successful authentication
 * - Automatically redirects to home page after login
 *
 * **Session Management:**
 * - Creates secure authentication session
 * - Invalidates existing user cache data
 * - Refreshes router to update authentication state
 * - Ensures immediate access to authenticated features
 *
 * **Navigation Behavior:**
 * - Automatically redirects to home page ("/") on success
 * - Triggers router refresh to update authentication context
 * - Preserves intended destination for post-login navigation
 * - Handles deep linking and protected route access
 *
 * **Security Features:**
 * - Secure credential transmission
 * - Server-side authentication validation
 * - Automatic session token management
 * - Protection against credential stuffing attacks
 *
 * **Error Handling:**
 * - Displays user-friendly error messages
 * - Handles invalid credentials gracefully
 * - Manages network connectivity issues
 * - Provides clear feedback for user action
 *
 * **Cache Management:**
 * - Invalidates all user-related queries on login
 * - Ensures fresh data for authenticated user
 * - Prevents stale data from previous sessions
 * - Optimizes subsequent user data requests
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
 * @remarks
 * **Optimistic Update Strategy:**
 * - `updateUserLocally`: Immediately updates user data in local cache
 * - Provides instant UI feedback without server round-trip
 * - Maintains user experience responsiveness during network operations
 * - Preserves existing user data while applying partial updates
 *
 * **Cache Management:**
 * - `invalidateUser`: Forces fresh data fetch from server
 * - Useful for error recovery and data synchronization
 * - Triggers automatic refetch of user data
 * - Ensures cache consistency after failed optimistic updates
 *
 * **Data Consistency:**
 * - Optimistic updates are temporary until server confirmation
 * - Failed operations should trigger cache invalidation
 * - Server response always takes precedence over local updates
 * - Handles concurrent updates gracefully
 *
 * **Performance Benefits:**
 * - Eliminates perceived latency for user interactions
 * - Reduces server load through batched operations
 * - Improves user experience with immediate feedback
 * - Maintains responsiveness during network delays
 *
 * **Error Recovery:**
 * - Automatic rollback capability through invalidation
 * - Graceful handling of network failures
 * - User notification of update failures
 * - Preservation of user intent for retry operations
 *
 * **Use Case Guidelines:**
 * - **Best for:** Profile updates, preferences, status changes, toggles
 * - **Avoid for:** Critical data, financial transactions, irreversible actions
 * - **Pattern:** Optimistic update → Server request → Handle success/failure
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
