import { useState } from "react";
import { FiPackage, FiSun, FiMoon, FiMenu, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BiTransfer } from "react-icons/bi";
import { MdOutlineSchedule } from "react-icons/md";
import { ABOUT, DATA_EXPORT, SETTINGS } from "../utils/app.constants";
import { useTheme } from "../utils/ThemeContext";
import { useSidebar } from "../utils/SidebarContext";
import MenuItem from "./MenuItem";

const SIDEBAR_EXPANDED = 300;
const SIDEBAR_COLLAPSED = 60;

const Menu = () => {
  const { isDark, toggleTheme } = useTheme();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div
      className={`dark:border-gray-700 dark:bg-dark-900 transition-all duration-300 ease-in-out flex flex-col overflow-hidden`}
      style={{
        borderRight: `1px solid #d5dde5`,
        width: collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`,
        height: "100vh",
        padding: 0,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-full py-3 text-gray-400 hover:text-gray-600 
                   dark:hover:text-gray-300 transition-colors duration-200 border-b border-gray-100 
                   dark:border-gray-800"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <FiChevronRight className="text-lg" />
        ) : (
          <FiChevronLeft className="text-lg" />
        )}
      </button>

      {/* Navigation items */}
      <div className="flex-1 py-2">
        <MenuItem item={DATA_EXPORT} collapsed={collapsed}>
          <BiTransfer style={{ fontSize: "22px" }} />
        </MenuItem>

        <MenuItem item={SETTINGS} collapsed={collapsed}>
          <FiPackage style={{ fontSize: "22px" }} />
        </MenuItem>

        <MenuItem item={ABOUT} collapsed={collapsed}>
          <MdOutlineSchedule style={{ fontSize: "22px" }} />
        </MenuItem>
      </div>

      {/* Dark mode toggle at bottom */}
      <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center w-full rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800
                     transition-all duration-200 ${collapsed ? 'py-2 px-0' : 'gap-3 px-4 py-2.5'}`}
          title={collapsed ? (isDark ? "Light Mode" : "Dark Mode") : ""}
        >
          {isDark ? (
            <FiSun className={`${collapsed ? 'text-xl' : 'text-lg'} text-amber-400 flex-shrink-0`} />
          ) : (
            <FiMoon className={`${collapsed ? 'text-xl' : 'text-lg'} text-indigo-400 flex-shrink-0`} />
          )}
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </div>
    </div>
  );
};

export default Menu;
