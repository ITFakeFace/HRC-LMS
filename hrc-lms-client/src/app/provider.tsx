// src/app/providers.tsx
"use client"; // Bắt buộc phải là Client Component

import { Provider } from "react-redux";
import { persistor, store } from "../store/store";
import { PersistGate } from "redux-persist/integration/react";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
