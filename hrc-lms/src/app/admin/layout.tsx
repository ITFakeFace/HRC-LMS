"use client"
import RequiredRolePage from "@/components/security/RequiredRolePage";
import React from "react";
import {faBell, faCompress, faExpand, faHome, faSchool, faSignOut, faUser} from "@fortawesome/free-solid-svg-icons";
import NavItem, {MatchTypes} from "@/components/layout/admin/navbar/NavItem";
import {IconTypes} from "@/components/general/IconWrapper";
import {useRouter} from "next/navigation";
import RectangleHRCLogo from "@/components/layout/general/navbar/RectangleHRCLogo";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const AdminLayout = ({children,}: Readonly<{
    children: React.ReactNode;
}>) => {
    const router = useRouter();
    const [navCollapsed, setNavCollapsed] = React.useState(false);
    const handleHomeClick = () => {
        router.push("/");
    }
    return (
        <RequiredRolePage roles={['admin']}>
            <div className={`flex flex-row`}>
                <nav
                    className={`${navCollapsed ? 'w-[100px]' : 'w-[200px]'} max-w-[200px] flex flex-col justify-between items-center gap-2 p-2 min-h-screen bg-gray-50
                        transition-all duration-200 ease-in-out
                    `}
                >
                    <div className={`w-full flex flex-col justify-center items-center gap-2`}>
                        <button
                            className={`cursor-pointer mb-10`}
                        >
                            <div className="w-[200px] h-[65px] flex items-center justify-center">
                                <RectangleHRCLogo
                                    logoHeight={65}
                                    classname={`${!navCollapsed && "hidden"}`}
                                    hasText={false}
                                />
                                <RectangleHRCLogo
                                    logoHeight={65}
                                    classname={`${navCollapsed && "hidden"}`}
                                    hasText={true}
                                />
                            </div>
                        </button>
                        <NavItem
                            text={"Overview"}
                            iconType={IconTypes.FontAwesome}
                            icon={faHome}
                            url={"/admin"}
                            activeCondition={"/admin"}
                            isCollapsed={navCollapsed}
                        />
                        <NavItem
                            text={"Accounts"}
                            iconType={IconTypes.FontAwesome}
                            icon={faUser}
                            url={"/admin/accounts"}
                            activeCondition={"/admin/accounts"}
                            isCollapsed={navCollapsed}
                            matchType={MatchTypes.Prefix}
                        />
                        <NavItem
                            text={"Courses"}
                            iconType={IconTypes.FontAwesome}
                            icon={faSchool}
                            url={"/admin/courses"}
                            activeCondition={"/admin/courses"}
                            isCollapsed={navCollapsed}
                            matchType={MatchTypes.Prefix}
                        />
                        <NavItem
                            text={"Classes"}
                            iconType={IconTypes.FontAwesome}
                            icon={faSchool}
                            url={"/admin/class"}
                            activeCondition={"/admin/class"}
                            isCollapsed={navCollapsed}
                            matchType={MatchTypes.Prefix}
                        />
                    </div>
                    <div
                        className={`w-full flex ${navCollapsed ? "flex-col" : "flex-row"} gap-1 justify-center items-center`}>
                        <button
                            className={`${navCollapsed ? "w-full" : "w-1/2"} bg-primary text-white py-1 rounded-4xl`}
                            onClick={() => setNavCollapsed(!navCollapsed)}
                            title={navCollapsed ? "Expand" : "Collapse"}
                        >
                            <FontAwesomeIcon icon={faSignOut}/>
                        </button>
                        <button
                            className={`${navCollapsed ? "w-full" : "w-1/2"} bg-primary text-white py-1 rounded-4xl`}
                            onClick={() => setNavCollapsed(!navCollapsed)}
                            title={navCollapsed ? "Expand" : "Collapse"}
                        >
                            {navCollapsed ?
                                <FontAwesomeIcon icon={faExpand}/> :
                                <FontAwesomeIcon icon={faCompress}/>
                            }
                        </button>
                    </div>

                </nav>
                <div className={`flex flex-col w-full min-h-screen`}>
                    <header className={`flex flex-row items-end justify-end gap-2 py-5 px-10 gap-5`}>
                        <FontAwesomeIcon icon={faBell} onClick={handleHomeClick} size={"xl"}/>
                        <FontAwesomeIcon icon={faUser} onClick={handleHomeClick} size={"xl"}/>
                    </header>
                    <main className={`flex-grow `}>
                        {children}
                    </main>
                    <footer className={`bg-primary text-white`}>
                        This is footer
                    </footer>
                </div>
            </div>
        </RequiredRolePage>
    )
}

export default AdminLayout;