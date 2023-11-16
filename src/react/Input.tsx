import React, { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { InputProps } from "./props";
import { useBeakContext } from "./Beak";
import { useBeakThemeContext } from "./Theme";
import "../css/Input.css";

export const Input: React.FC<InputProps> = ({ inProgress, onSend }) => {
  const context = useBeakContext();
  const themeContext = useBeakThemeContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDivClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Check if the clicked element is not the textarea itself
    if (event.target !== event.currentTarget) return;

    textareaRef.current?.focus();
  };

  const [text, setText] = useState("");
  const send = () => {
    if (inProgress) return;
    onSend(text);
    setText("");

    textareaRef.current?.focus();
  };

  const icon = inProgress
    ? themeContext.icons.activityIcon
    : themeContext.icons.sendIcon;
  const disabled = inProgress || text.length === 0;

  return (
    <div className="beakInput" onClick={handleDivClick}>
      <button disabled={disabled} onClick={send}>
        {icon}
      </button>
      <TextareaAutosize
        ref={textareaRef}
        placeholder={context.labels.placeholder}
        autoFocus={true}
        maxRows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
    </div>
  );
};
