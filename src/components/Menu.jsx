import { FiPackage } from "react-icons/fi";
import { BiTransfer } from "react-icons/bi";
import { MdOutlineSchedule } from "react-icons/md";
import { ABOUT, DATA_EXPORT, SCHEDULE, SETTINGS } from "../utils/app.constants";
import MenuItem from "./MenuItem";


const Menu = () =>(
    <div
      style={{
        borderRight: `1px solid #d5dde5`,
        width: "300px",
        height: "100vh",
        padding: "2px 0px",
      }}
    >
      <MenuItem item={DATA_EXPORT}>
        <BiTransfer style={{ fontSize: "22px" }} />
      </MenuItem>

      <MenuItem item={SETTINGS}>
        <FiPackage style={{ fontSize: "22px" }} />
      </MenuItem>

      {/* <MenuItem item={SCHEDULE}>
        <MdOutlineSchedule style={{ fontSize: "22px" }} />
      </MenuItem> */}

      <MenuItem item={ABOUT}>
        <MdOutlineSchedule style={{ fontSize: "22px" }} />
      </MenuItem>
    </div>
  );

export default Menu;
