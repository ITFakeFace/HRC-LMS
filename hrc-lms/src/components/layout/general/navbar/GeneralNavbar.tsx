"use client"
import SignInButton from "@/components/layout/general/navbar/SignInButton";
import HRCLogo from "@/components/layout/general/navbar/HRCLogo";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";

export default function GeneralNavbar() {
    const navHeight: number = 75;
    const user = useSelector((state: RootState) => state.auth.user);
    return (
        <nav className={`w-full`}>
            <div className={`w-full flex flex-row justify-between px-10`}
                 style={{
                     height: `${navHeight}px`,
                 }}
            >
                <div className={`w-fit h-full flex items-center`}>
                    <HRCLogo logoHeight={navHeight - 25}/>
                </div>
                <div className={`w-fit h-full flex align-middle justify-center items-center`}>
                    {user ? <div>{user.username}</div> : <SignInButton/>}
                </div>
            </div>
        </nav>
    )
}