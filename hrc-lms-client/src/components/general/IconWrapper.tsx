import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconDefinition} from "@fortawesome/free-solid-svg-icons";

export enum IconTypes {
    FontAwesome = "FontAwesome",
    PrimeIcon = "PrimeIcon",
}

type IconWrapperProps =
    | {
    type: IconTypes.FontAwesome;
    icon: IconDefinition;   // Bắt buộc là object
    className?: string;
}
    | {
    type: IconTypes.PrimeIcon;
    icon: string;           // Bắt buộc là class string, ví dụ: "pi pi-user"
    className?: string;
};

const IconWrapper: React.FC<IconWrapperProps> = ({type, icon, className}) => {
    if (type === IconTypes.FontAwesome) {
        return <FontAwesomeIcon icon={icon} className={className}/>;
    }

    if (type === IconTypes.PrimeIcon) {
        return <i className={`${icon} ${className}`}/>;
    }

    return null;
};

export default IconWrapper;