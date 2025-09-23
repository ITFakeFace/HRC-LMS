"use client";
import RectLogo from "@/assets/logos/RectLogo.jpg";
import RectLogoNoText from "@/assets/logos/RectLogo_NoText.jpg";
import Image from "next/image";
import {useRouter} from "next/navigation";

interface HRCLogoProps {
    logoHeight?: number; // optional
    classname?: string;
    hasText?: boolean;
}

export default function RectangleHRCLogo({logoHeight = 50, classname = "", hasText = true}: HRCLogoProps) {
    const router = useRouter();
    const goHome = () => {
        router.push("/");
    }
    if (hasText)
        return (
            <Image src={RectLogo} alt={"Original Logo"} height={logoHeight}
                   onClick={goHome}
                   className={`cursor-pointer ${classname}`}
            />
        );
    else
        return (
            <Image src={RectLogoNoText} alt={"Original Logo"} height={logoHeight}
                   onClick={goHome}
                   className={`cursor-pointer ${classname}`}
            />
        );
}