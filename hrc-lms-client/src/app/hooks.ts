// src/app/hooks.ts
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";

// Sử dụng hook này thay vì useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
// Sử dụng hook này thay vì useSelector
export const useAppSelector = useSelector.withTypes<RootState>();
