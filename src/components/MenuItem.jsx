import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";


const MenuItem = memo(({ item, children, collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClickMenu = (url) => navigate(url);
  const activateMenu = (url) => {
    let classString = "";
    if (location.pathname.endsWith(url?.toLowerCase())) {
      classString = "active";
    }
    return classString;
  };
  const constantToTitle = (c) => c.replace("-", " ");
  const constantToLink = (c) => c.toLowerCase();

  return (
    <div
      className={`menu-item ${activateMenu(constantToLink(item))} ${collapsed ? 'justify-center px-0' : ''}`}
      onClick={() => handleClickMenu(constantToLink(item))}
      title={collapsed ? constantToTitle(item) : undefined}
    >
      <span className="flex-shrink-0">{children}</span>
      {!collapsed && <span style={{ marginLeft: "10px" }}>{constantToTitle(item)}</span>}
    </div>
  );
});

export default MenuItem;
