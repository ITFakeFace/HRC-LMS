"use client"
import {useRouter} from "next/navigation";

export default function SignInButton() {
    const router = useRouter();
    const goLogin = () => {
        router.push("/login");
    }
    return (
        <button
            className={`border-2 border-primary rounded-md px-4 py-0.5
                hover:bg-primary hover:text-secondary cursor-pointer
                transition-all duration-300`}
            onClick={goLogin}
        >
            Đăng nhập
        </button>
    );
}