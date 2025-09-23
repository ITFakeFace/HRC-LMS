// components/AccessControl.tsx
"use client";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {AuthHelper} from "@/utils/AuthHelper";

interface AccessControlProps {
    children: React.ReactNode;
    roles?: string[];
    permissions?: string[];
}

export default function AccessControlPage({children, roles, permissions}: AccessControlProps) {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        // check roles
        if (roles && !AuthHelper.hasRole(user.roles ?? [], roles)) {
            router.replace("/403");
            return;
        }

        // check permissions
        if (permissions && !AuthHelper.hasPermissions(user.permissions ?? [], permissions)) {
            router.replace("/403");
            return;
        }
    }, [user, roles, permissions, router]);

    return <>{children}</>;
}
