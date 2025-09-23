// components/RequireRole.tsx
"use client";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {AuthHelper} from "@/utils/AuthHelper";

interface RequireRoleProps {
    children: React.ReactNode;
    roles: string[]; // danh sách role cần có
}

export default function RequiredRolePage({children, roles}: RequireRoleProps) {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        
        if (!AuthHelper.hasRole(user.roles, roles)) {
            router.push("/403");
        }
    }, [user, roles, router]);

    return (<>{children}</>);
}
