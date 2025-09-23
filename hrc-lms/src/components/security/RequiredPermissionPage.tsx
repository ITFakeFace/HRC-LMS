// components/RequirePermission.tsx
"use client";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {AuthHelper} from "@/utils/AuthHelper";

interface RequirePermissionProps {
    children: React.ReactNode;
    permissions: string[];
}

export default function RequiredPermissionPage({children, permissions}: RequirePermissionProps) {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!AuthHelper.hasRole(user.permissions, permissions)) {
            router.push("/403");
        }
    }, [user, permissions, router]);

    return <>{children}</>;
}
