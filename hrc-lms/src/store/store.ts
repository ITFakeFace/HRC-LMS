import {configureStore} from "@reduxjs/toolkit";
import AuthReducer from "@/store/AuthSlice";

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
    },
});

// Infer types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;