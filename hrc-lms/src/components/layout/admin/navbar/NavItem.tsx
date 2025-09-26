import IconWrapper, {IconTypes} from "@/components/general/IconWrapper";
import {usePathname, useRouter} from "next/navigation";

export enum MatchTypes {
    Exact = "exact",
    Prefix = "prefix",
}

interface NavItemProps {
    text: string;
    url: string;
    activeCondition: string;
    matchType?: MatchTypes;
    isCollapsed: boolean;
    iconType: IconTypes;
    icon: any;
    iconClassName?: string;
}

const NavItem: React.FC<NavItemProps> = (
    {
        text,
        url,
        activeCondition,
        matchType = MatchTypes.Exact,
        isCollapsed,
        iconType,
        icon,
        iconClassName = "text-current w-5 h-5",
    }) => {
    const pathname = usePathname(); // lấy đường dẫn hiện tại
    const router = useRouter();
    const checkActiveCondition = () => {
        if (matchType === MatchTypes.Exact) {
            return normalizePath(pathname) === normalizePath(activeCondition);
        }
        if (matchType === MatchTypes.Prefix) {
            return normalizePath(pathname).startsWith(normalizePath(activeCondition));
        }
        return false;
    };
    const normalizePath = (path: string) => path.replace(/\/+$/, "");
    const isActive = checkActiveCondition();
    const handleClick = () => {
        router.push(url);
    }
    return (
        <button
            className={`flex items-center gap-2 py-2 px-5 cursor-pointer w-full text-md rounded-4xl border-transparent
                transition-all duration-100 ease-in-out
                ${isActive ? 'bg-primary text-white border-2' : 'text-gray-500'} 
                hover:bg-primary hover:text-white hover:border-2
                ${isCollapsed ? "items-center justify-center" : ""}
            `}
            onClick={handleClick}
        >
            <IconWrapper type={iconType} icon={icon}
                         className={iconClassName}/>
            {!isCollapsed && <span>{text}</span>}
        </button>
    );
};

export default NavItem;