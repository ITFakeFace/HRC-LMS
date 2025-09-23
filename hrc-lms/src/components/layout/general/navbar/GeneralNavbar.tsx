"use client"
import SignInButton from "@/components/layout/general/navbar/SignInButton";
import RectangleHRCLogo from "@/components/layout/general/navbar/RectangleHRCLogo";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "@/store/store";
import {logout} from "@/store/AuthSlice";
import {useRouter} from "next/navigation";

export default function GeneralNavbar() {
    const navHeight: number = 75;
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const handleLMSRouting = () => {
        router.push("/admin");
    }
    const handleLogout = () => {
        dispatch(logout());
    }
    return (
        <nav className={`w-full`}>
            <div className={`w-full flex flex-row justify-between px-10`}
                 style={{
                     height: `${navHeight}px`,
                 }}
            >
                <div className={`w-fit h-full flex items-center`}>
                    <RectangleHRCLogo logoHeight={navHeight - 25}/>
                </div>
                <div className={`w-fit h-full flex align-middle justify-center items-center`}>
                    {user
                        ? <div>
                            <button onClick={handleLMSRouting}>{user.username}</button>
                            | <button onClick={handleLogout}>Đăng xuất</button></div>
                        : <SignInButton/>}
                </div>
            </div>
        </nav>
    )
}