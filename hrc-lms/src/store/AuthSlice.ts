import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface UserInfo {
    id: string;
    email: string;
    username: string;
    avatar: string | null; // base64 string hoặc null
}

interface AuthState {
    token: string | null;
    user: UserInfo | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
};

const AuthSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (
            state,
            action: PayloadAction<{ token: string; user: UserInfo }>
        ) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const {loginSuccess, logout} = AuthSlice.actions;
export default AuthSlice.reducer;
