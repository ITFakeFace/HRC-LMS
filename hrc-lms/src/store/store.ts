import {combineReducers, configureStore} from "@reduxjs/toolkit";
import AuthReducer from "@/store/AuthSlice";
import {persistStore, persistReducer} from "redux-persist";
import storage from "@/redux/storage";

// Gộp tất cả reducer
const rootReducer = combineReducers({
    auth: AuthReducer,
});

// Chỉ persist auth
const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"], // ✅ chỉ lưu auth
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,   // ✅ dùng persistedReducer trực tiếp
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

// Infer types
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
