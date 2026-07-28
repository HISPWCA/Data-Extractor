import { FiPackage, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BiTransfer } from "react-icons/bi";
import { MdOutlineSchedule } from "react-icons/md";
import { ABOUT, DATA_EXPORT, SETTINGS } from "../utils/app.constants";
import { useSidebar } from "../utils/SidebarContext";
import MenuItem from "./MenuItem";

const SIDEBAR_EXPANDED = 300;
const SIDEBAR_COLLAPSED = 60;

const Menu = () => {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div
      className="transition-all duration-300 ease-in-out flex flex-col overflow-hidden"
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
        className="flex items-center justify-center w-full py-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 border-b border-gray-100"
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
    </div>
  );
};

export default Menu;
