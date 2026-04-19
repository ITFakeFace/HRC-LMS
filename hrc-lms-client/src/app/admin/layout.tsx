"use client";
import React from "react";
import {
  faBell,
  faCog,
  faCompress,
  faExpand,
  faHome,
  faLock,
  faSchool,
  faSignOut,
  faUser,
  faUserLock,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch } from "react-redux";
import { logOut } from "@/src/features/auth/authSlice";
import RectangleHRCLogo from "@/src/components/layouts/general/RectangleHRCLogo";
import NavItem, {
  MatchTypes,
} from "@/src/components/layouts/admin/navbar/NavItem";
import { IconTypes } from "@/src/components/general/IconWrapper";
import { PermissionGuard } from "@/src/components/auth/PermissionGuard";

const AdminLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [navCollapsed, setNavCollapsed] = React.useState(false);
  const handleHomeClick = () => {
    router.push("/");
  };
  const handleLogoutClick = () => {
    dispatch(logOut());
    router.push("/login");
  };
  return (
    <PermissionGuard requiredRoles={["SUPER_ADMIN", "ADMIN"]} redirectTo="/">
      <div className="flex flex-row min-h-screen overflow-hidden">
        <nav
          className={`${navCollapsed ? "w-[100px]" : "w-[200px]"} shrink-0 
                        flex flex-col justify-between items-center gap-2 p-2 bg-gray-50
                        transition-all duration-200 ease-in-out
                    `}
        >
          <div
            className={`w-full flex flex-col justify-center items-center gap-2`}
          >
            <button className={`cursor-pointer mb-10`}>
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
              text={"Users"}
              iconType={IconTypes.FontAwesome}
              icon={faUser}
              url={"/admin/users"}
              activeCondition={"/admin/users"}
              isCollapsed={navCollapsed}
              matchType={MatchTypes.Prefix}
            />
            <NavItem
              text={"Roles"}
              iconType={IconTypes.FontAwesome}
              icon={faUserLock}
              url={"/admin/roles"}
              activeCondition={"/admin/roles"}
              isCollapsed={navCollapsed}
              matchType={MatchTypes.Prefix}
            />
            <NavItem
              text={"Permissions"}
              iconType={IconTypes.FontAwesome}
              icon={faLock}
              url={"/admin/permissions"}
              activeCondition={"/admin/permissions"}
              isCollapsed={navCollapsed}
              matchType={MatchTypes.Prefix}
            />
            <NavItem
              text={"Categories"}
              iconType={IconTypes.FontAwesome}
              icon={faSchool}
              url={"/admin/categories"}
              activeCondition={"/admin/categories"}
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
              text={"Templates"}
              iconType={IconTypes.FontAwesome}
              icon={faCog}
              url={"/admin/template-manager"}
              activeCondition={"/admin/template-manager"}
              isCollapsed={navCollapsed}
              matchType={MatchTypes.Prefix}
            />
          </div>
          <div
            className={`w-full flex ${
              navCollapsed ? "flex-col" : "flex-row"
            } gap-1 justify-center items-center`}
          >
            <button
              className={`${
                navCollapsed ? "w-full" : "w-1/2"
              } bg-primary text-white py-1 rounded-4xl`}
              onClick={handleLogoutClick}
              title={navCollapsed ? "Expand" : "Collapse"}
            >
              <FontAwesomeIcon icon={faSignOut} />
            </button>
            <button
              className={`${
                navCollapsed ? "w-full" : "w-1/2"
              } bg-primary text-white py-1 rounded-4xl`}
              onClick={() => setNavCollapsed(!navCollapsed)}
              title={navCollapsed ? "Expand" : "Collapse"}
            >
              {navCollapsed ? (
                <FontAwesomeIcon icon={faExpand} />
              ) : (
                <FontAwesomeIcon icon={faCompress} />
              )}
            </button>
          </div>
        </nav>
        <div className="flex flex-col flex-1 overflow-auto">
          <header className="flex flex-row items-end justify-end gap-2 py-5 px-10">
            <FontAwesomeIcon
              icon={faBell}
              onClick={handleHomeClick}
              size={"xl"}
            />
            <FontAwesomeIcon
              icon={faUser}
              onClick={handleHomeClick}
              size={"xl"}
            />
          </header>
          <main className={`grow m-5`}>{children}</main>
          <footer className={`bg-primary text-white`}>
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm">
                &copy; 2025 <span className="font-semibold">HRC-LMS</span>. All
                rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AdminLayout;
