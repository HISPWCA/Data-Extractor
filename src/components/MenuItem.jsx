import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const COLORS_BY_ROUTE = {
  "data-export": { accent: "border-blue-500", bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-800" },
  settings: { accent: "border-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-800" },
  about: { accent: "border-purple-500", bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-800" },
}

const MenuItem = memo(({ item, children, collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const link = item.toLowerCase();
  const isActive = location.pathname.endsWith(link);
  const colors = COLORS_BY_ROUTE[link] || { accent: "border-gray-400", bg: "bg-gray-100", icon: "text-gray-600", text: "text-gray-800" };
  const label = item.replace(/-/g, " ");

  return (
    <div className="relative px-2 py-0.5">
      <button
        onClick={() => navigate(link)}
        title={collapsed ? label : undefined}
        className={`
          relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5
          text-sm font-medium transition-all duration-200 ease-out
          ${isActive
            ? `${colors.bg} ${colors.text} shadow-sm`
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }
          ${collapsed ? "justify-center px-0" : ""}
          active:scale-[0.98]
        `}
      >
        {/* Left accent bar for active item */}
        {isActive && (
          <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full ${colors.accent} transition-all duration-200`} />
        )}

        {/* Icon */}
        <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? colors.icon : "text-gray-400"}`}>
          {children}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="truncate">{label}</span>
        )}
      </button>
    </div>
  );
});

export default MenuItem;
