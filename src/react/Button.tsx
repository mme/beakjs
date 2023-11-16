import React from "react";
import { ButtonProps } from "./props";
import "../css/Button.css";
import { useBeakThemeContext } from "./Theme";

export const Button: React.FC<ButtonProps> = ({ open, setOpen }) => {
  const context = useBeakThemeContext();
  // To ensure that the mouse handler fires even when the button is scaled down
  // we wrap the button in a div and attach the handler to the div
  return (
    <div onClick={() => setOpen(!open)}>
      <button
        className={`beakButton ${open ? "open" : ""}`}
        aria-label={open ? "Close Chat" : "Open Chat"}
      >
        <div className="beakButtonIcon beakButtonIconOpen">
          {context.icons.openIcon}
        </div>
        <div className="beakButtonIcon beakButtonIconClose">
          {context.icons.closeIcon}
        </div>
      </button>
    </div>
  );
};
