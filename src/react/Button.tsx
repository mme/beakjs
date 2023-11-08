import React from "react";
import "../css/Button.css";
import { CopilotContext } from "./Copilot";

interface ButtonProps {
  open: boolean;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ open, onClick }) => {
  const context = React.useContext(CopilotContext);
  // To ensure that the mouse handler fires even when the button is scaled down
  // we wrap the button in a div and attach the handler to the div
  return (
    <div onClick={onClick}>
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
