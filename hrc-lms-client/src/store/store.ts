// src/store/store.ts

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
// Import storage types and utils for Redux Persist
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { authReducer } from "@/src/features/auth/authSlice";

// --- 1. Conditional Storage Setup ---

// Xác định môi trường: Nếu có đối tượng window, ta đang ở Client
const isClient = typeof window !== "undefined";

const storage = isClient
  ? require("redux-persist/lib/storage").default
  : {
      // NoopStorage (Lưu trữ rỗng cho Server-side để tránh crash)
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: any) => Promise.resolve(),
      removeItem: (_key: string) => Promise.resolve(),
    };

const persistConfig = {
  key: "root",
  // Sử dụng storage đã được định nghĩa ở trên
  storage,
  // Loại trừ slice 'auth' để đảm bảo token được quản lý qua Cookies (bảo mật)
  // và logic khôi phục phiên (hydration) hoạt động đúng cách.
  whitelist: ["auth"],
  blacklist: [],
};

// --- 2. Root Reducer Setup ---

const rootReducer = combineReducers({
  auth: authReducer,
  // ... Thêm các slices khác của bạn ở đây (ví dụ: ui: uiReducer)
});

// Tạo Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- 3. Store Configuration ---

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Tắt kiểm tra serializable cho các action của redux-persist
      // để tránh cảnh báo/lỗi khi lưu trữ state vào Local Storage.
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// --- 4. Persistor Export ---

export const persistor = persistStore(store);

// --- 5. Type Definitions ---

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
