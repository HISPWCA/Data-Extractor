import { FiPackage, FiChevronLeft, FiChevronRight, FiMenu, FiX } from "react-icons/fi";
import { BiTransfer } from "react-icons/bi";
import { MdOutlineSchedule } from "react-icons/md";
import { ABOUT, DATA_EXPORT, SETTINGS } from "../utils/app.constants";
import { useSidebar } from "../utils/SidebarContext";
import MenuItem from "./MenuItem";

const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 60;

const ToggleBtn = ({ icon, onClick, title }) => (
  <button onClick={onClick}
    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95"
    title={title}>
    {icon}
  </button>
);

const Menu = () => {
  const { collapsed, toggleSidebar, isMobile, mobileOpen, toggleMobileOpen } = useSidebar();

  const sidebarContent = (
    <>
      {/* ── Toggle / Close ── */}
      <div className="flex items-center justify-end px-3 py-3 border-b border-gray-100">
        {isMobile ? (
          <ToggleBtn icon={<FiX className="text-base" />} onClick={toggleMobileOpen} title="Close" />
        ) : (
          <ToggleBtn
            icon={collapsed ? <FiChevronRight className="text-base" /> : <FiChevronLeft className="text-base" />}
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        )}
      </div>

      {/* ── Menu Items ── */}
      <div className="flex-1 py-4 space-y-0.5">
        <MenuItem item={DATA_EXPORT} collapsed={collapsed}>
          <BiTransfer style={{ fontSize: "20px" }} />
        </MenuItem>
        <MenuItem item={SETTINGS} collapsed={collapsed}>
          <FiPackage style={{ fontSize: "20px" }} />
        </MenuItem>
        <MenuItem item={ABOUT} collapsed={collapsed}>
          <MdOutlineSchedule style={{ fontSize: "20px" }} />
        </MenuItem>
      </div>

      {/* ── Version badge ── */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] font-bold text-white shadow-sm">
              D
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-gray-700 leading-tight">Data Extractor</span>
              <span className="text-[9px] text-gray-400 leading-tight">v{process.env.REACT_APP_VERSION || '1.0'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <button onClick={toggleMobileOpen}
          className="fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
          {mobileOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={toggleMobileOpen} />
        )}
        <div className={`fixed left-0 top-0 z-40 h-full bg-white shadow-xl ${
          mobileOpen ? 'animate-slide-in-left' : '-translate-x-full'
        }`} style={{ width: SIDEBAR_EXPANDED }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div
      className="transition-all duration-300 ease-in-out flex flex-col shadow-sm bg-white"
      style={{
        borderRight: `1px solid #e5e7eb`,
        width: collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`,
        height: "100vh",
        padding: 0,
        position: "relative",
        flexShrink: 0,
      }}>
      {sidebarContent}
    </div>
  );
};

export default Menu;
