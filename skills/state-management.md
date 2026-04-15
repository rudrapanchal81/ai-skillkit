---
name: state-management
description: State management patterns with Redux, Zustand, Context API, and React Query for scalable applications
version: 1.0.0
category: frontend
tags: [state, redux, zustand, context, react-query, tanstack-query, global-state]
---

# State Management Skill

Modern state management patterns for React applications using Redux, Zustand, Context API, and server state with React Query.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Global state management | ✅ Yes | Simple local state only |
| Redux Toolkit setup | ✅ Yes | No shared state needed |
| Zustand store creation | ✅ Yes | Component-level state |
| React Query for server state | ✅ Yes | No API calls |
| Context API patterns | ✅ Yes | Static configuration only |

## Triggers

Use this skill when the request includes:
- State management, global state, shared state
- Redux, Redux Toolkit, RTK Query
- Zustand, store, actions
- React Query, TanStack Query, server state
- Context API, useContext, Provider
- State persistence, rehydration

## Anti-Triggers

Do NOT use this skill when:
- Only using local component state (useState)
- Static configuration without updates
- Server-side rendering without client state
- Pure presentational components

## Implementation Patterns

### 1. Zustand (Recommended for Most Cases)

```ts
// stores/userStore.ts - Simple and powerful state management
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  fetchUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user, error: null }),

        clearUser: () => set({ user: null, error: null }),

        fetchUser: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`/api/users/${id}`);
            const user = await response.json();
            set({ user, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch user',
              isLoading: false 
            });
          }
        },
      }),
      {
        name: 'user-storage', // localStorage key
        partialize: (state) => ({ user: state.user }), // Only persist user
      }
    ),
    { name: 'UserStore' }
  )
);

// Usage in components
function UserProfile() {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser('user-123');
  }, [fetchUser]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Selecting specific state (prevents unnecessary re-renders)
function UserName() {
  const userName = useUserStore((state) => state.user?.name);
  return <span>{userName}</span>;
}

// Multiple stores for different domains
interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  total: 0,

  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + item.price,
  })),

  removeItem: (id) => set((state) => {
    const item = state.items.find((i) => i.id === id);
    return {
      items: state.items.filter((i) => i.id !== id),
      total: state.total - (item?.price || 0),
    };
  }),

  clearCart: () => set({ items: [], total: 0 }),
}));
```

### 2. Redux Toolkit (For Complex Apps)

```ts
// store/index.ts - Redux Toolkit setup
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
};

// Async thunk for API calls
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, data }: { id: string; data: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUser
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // updateUser
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

// Usage in components
import { useAppDispatch, useAppSelector } from './store';
import { fetchUser, clearUser } from './store/slices/userSlice';

function UserProfile() {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUser('user-123'));
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(clearUser());
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### 3. React Query / TanStack Query (For Server State)

```ts
// hooks/useUsers.ts - Server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

// Fetch users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// Fetch single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json() as Promise<User>;
    },
    enabled: !!userId, // Only fetch if userId exists
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<User, 'id'>) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json() as Promise<User>;
    },
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Or optimistically update cache
      queryClient.setQueryData<User[]>(['users'], (old) => 
        old ? [...old, newUser] : [newUser]
      );
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json() as Promise<User>;
    },
    onSuccess: (updatedUser) => {
      // Update specific user in cache
      queryClient.setQueryData(['users', updatedUser.id], updatedUser);
      
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
    },
    onSuccess: (_, userId) => {
      // Remove from cache
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old?.filter((user) => user.id !== userId)
      );
    },
  });
}

// Usage in components
function UserList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const handleCreate = async () => {
    await createUser.mutateAsync({
      name: 'New User',
      email: 'new@example.com',
    });
  };

  const handleDelete = async (userId: string) => {
    await deleteUser.mutateAsync(userId);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create User</button>
      {users?.map((user) => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => handleDelete(user.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// Infinite scroll with React Query
export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/posts?page=${pageParam}&limit=20`);
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
```

### 4. Context API (For Theme, Auth, etc.)

```tsx
// contexts/AuthContext.tsx - Authentication context
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const userData = await response.json();
    setUser(userData);
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

## Critical Rules

1. **Choose the right tool**
   - Local state: useState
   - Shared client state: Zustand or Context
   - Server state: React Query
   - Complex apps: Redux Toolkit

2. **Avoid prop drilling**
   - Use Context or state management library
   - Don't pass props through 3+ levels
   - Consider component composition

3. **Keep state normalized**
   - Store entities by ID
   - Avoid nested duplicates
   - Use selectors for derived data

4. **Separate server and client state**
   - Use React Query for server data
   - Use Zustand/Redux for UI state
   - Don't duplicate server data in global state

5. **Use selectors wisely**
   - Select only needed data
   - Prevents unnecessary re-renders
   - Memoize expensive selectors

6. **Handle loading and error states**
   - Always show loading indicators
   - Display error messages
   - Provide retry mechanisms

7. **Persist state when needed**
   - Use localStorage for user preferences
   - Encrypt sensitive data
   - Handle rehydration properly

8. **Keep actions simple**
   - One action per user interaction
   - Use thunks for async logic
   - Avoid side effects in reducers

## Common Mistakes to Avoid

1. ❌ Using global state for everything
2. ❌ Not separating server and client state
3. ❌ Prop drilling instead of context
4. ❌ Mutating state directly
5. ❌ Not handling loading/error states
6. ❌ Over-engineering simple state
7. ❌ Not using selectors
8. ❌ Storing derived data in state

## Dependencies

```json
{
  "zustand": "^4.4.0",
  "@reduxjs/toolkit": "^2.0.0",
  "react-redux": "^9.0.0",
  "@tanstack/react-query": "^5.0.0"
}
```
