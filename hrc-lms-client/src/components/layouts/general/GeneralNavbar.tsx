"use client";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/src/store/store";
import { logOut } from "@/src/features/auth/authSlice";
import RectangleHRCLogo from "./RectangleHRCLogo";
import SignInButton from "./SignInButton";

export default function GeneralNavbar() {
  const navHeight: number = 75;
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const handleLMSRouting = () => {
    router.push("/admin");
  };
  const handleLogout = () => {
    dispatch(logOut());
  };
  return (
    <nav className={`w-full`}>
      <div
        className={`w-full flex flex-row justify-between px-10`}
        style={{
          height: `${navHeight}px`,
        }}
      >
        <div className={`w-fit h-full flex items-center`}>
          <RectangleHRCLogo logoHeight={navHeight - 25} />
        </div>
        <div
          className={`w-fit h-full flex align-middle justify-center items-center`}
        >
          {user ? (
            <div>
              <button onClick={handleLMSRouting}>{user.username}</button>|{" "}
              <button onClick={handleLogout}>Đăng xuất</button>
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
