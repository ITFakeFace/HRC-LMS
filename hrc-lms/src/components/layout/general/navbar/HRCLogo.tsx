"use client";
import RectLogo from "@/assets/logos/RectLogo.jpg";
import Image from "next/image";
import {useRouter} from "next/navigation";

interface HRCLogoProps {
    logoHeight?: number; // optional
}

export default function HRCLogo({logoHeight = 50}: HRCLogoProps) {
    const router = useRouter();
    const goHome = () => {
        router.push("/");
    }
    return (
        <Image src={RectLogo} alt={"Original Logo"} height={logoHeight}
               onClick={goHome}
               className={`cursor-pointer`}
        />
    )
}