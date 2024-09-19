import React from "react";
import { useLocation, useNavigate } from "react-router-dom";


const MenuItem = ({ item, children }) => {
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
      className={`menu-item ${activateMenu(constantToLink(item))}`}
      onClick={() => handleClickMenu(constantToLink(item))}
    >
      <span>{children}</span>
      <span style={{ marginLeft: "10px" }}>{constantToTitle(item)}</span>
    </div>
  );
};

export default MenuItem;
