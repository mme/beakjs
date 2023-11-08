import React, { useContext } from "react";
import "../css/Header.css";
import { CopilotContext } from "./Copilot";

interface HeaderProps {
  setOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setOpen }) => {
  const context = useContext(CopilotContext);

  return (
    <div className="beakHeader">
      <div>{context.messages.title}</div>
      <button onClick={() => setOpen(false)} aria-label="Close">
        {context.icons.headerCloseIcon}
      </button>
    </div>
  );
};
