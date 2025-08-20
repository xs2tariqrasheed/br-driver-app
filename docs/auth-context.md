## Auth Context (Reducer + AsyncStorage)

The Auth Context provides a global way to get and set the authenticated user object across the app, while persisting it to AsyncStorage to preserve login state across app restarts.

This context is designed to be a model for other global domains (e.g., Chat, Rides, Driver), each with its own reducer and provider. It follows React's `useReducer` best practices. See React docs: [useReducer](https://react.dev/reference/react/useReducer#usereducer).

### File locations

- Provider and hook: `context/AuthContext.tsx`
- Storage keys: `constants/global.ts` (`AUTH_STORAGE_KEY`)
- Helpers for storage: `utils/helpers.ts`

### State shape

```
type AuthObject = {
  token?: string | null;
  // Extendable fields, e.g. user: { id, name, roles }
} | null;

type AuthState = {
  auth: AuthObject;
  isHydrated: boolean; // prevents UI from flashing before storage is read
};
```

### Actions

- `HYDRATE_AUTH(payload: AuthObject)`: Sets initial state from AsyncStorage and marks hydration complete.
- `SET_AUTH(payload: AuthObject)`: Updates the in-memory state and persists to AsyncStorage.
- `CLEAR_AUTH()`: Clears in-memory state and removes from AsyncStorage.

### Lifecycle and persistence

On mount, the provider reads `AUTH_STORAGE_KEY` from AsyncStorage and dispatches `HYDRATE_AUTH`. While this is happening, children are not rendered (the provider returns `null`) to avoid UI flicker or mis-renders based on unknown auth state. Once hydrated, it renders children normally.

Any subsequent `setAuth(value)` calls will update the reducer state and persist the value (or remove it when `null`).

### Usage

1. Wrap the application inside `AuthProvider` (already done in `app/_layout.tsx`):

```tsx
// app/_layout.tsx
import { AuthProvider } from "@/context/AuthContext";

<BottomSheetModalProvider>
  <AuthProvider>{/* app stacks */}</AuthProvider>
</BottomSheetModalProvider>;
```

2. Use the hook anywhere to get and set auth:

```tsx
import { useAuth } from "@/context/AuthContext";

const [auth, setAuth] = useAuth();

// Check login state
if (auth?.token) {
  // user is logged in
}

// Set after successful login API
await setAuth({ token: "jwtToken", user: { id: "123", name: "Jane" } });

// Logout
await setAuth(null);
```

3. Login flow wiring (implemented in `app/(screens)/auth/login.tsx`):

- After a successful API call, the response object is passed to `setAuth(response)`. The expectation is that it contains at least a `token` field.
- The screen then navigates to `/(tabs)`.
- If `auth.token` already exists on mount (after hydration), the login screen redirects to `/(tabs)` automatically.

4. Logout flow wiring (implemented in `app/(tabs)/index.tsx`):

- The Logout button calls `await setAuth(null)` to clear both context and persisted storage, then navigates to the login route.

### Extending for other domains

For `Chat`, `Rides`, `Driver`, create similar files, e.g. `context/ChatContext.tsx`, with its own reducer state and hydration key. This keeps each feature's state isolated and focused while using a consistent pattern:

- Define a state shape and actions.
- Persist feature-specific state using a dedicated key (e.g., `@chat`).
- Export a provider and a hook `useChat()` returning `[chatState, setChatState]` or a richer API.

### Notes and best practices

- Keep reducers pure: avoid side effects inside the reducer function. All storage reads/writes happen in effects or in the setter function (`setAuth`).
- Avoid rendering children before hydration to prevent UI flicker or incorrect redirects.
- Keep the auth object shape stable and well-typed. Include `token` and any user info you need.
- Navigation guards should rely on `auth?.token` after hydration.
