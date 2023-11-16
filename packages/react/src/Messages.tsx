import React, { useEffect } from "react";
import { MessagesProps } from "./props";
import { useBeakContext } from "./Beak";
import "../../css/Messages.css";

export const Messages: React.FC<MessagesProps> = ({ messages }) => {
  const context = useBeakContext();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="beakMessages">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div key={index} className="beakMessage beakUserMessage">
              {message.content}
            </div>
          );
        } else if (message.role == "assistant" && message.status !== "error") {
          if (message.status === "pending" && !message.content) {
            return (
              <div key={index} className={`beakMessage beakAssistantMessage`}>
                {context.icons.spinnerIcon}
              </div>
            );
          } else if (message.status === "partial") {
            return (
              <div key={index} className={`beakMessage beakAssistantMessage`}>
                {context.labels.thinking} {context.icons.spinnerIcon}
              </div>
            );
          } else if (message.content) {
            return (
              <div key={index} className={`beakMessage beakAssistantMessage`}>
                {message.content}
              </div>
            );
          }
        } else if (
          message.role === "function" &&
          message.status === "success"
        ) {
          return (
            <div key={index} className={`beakMessage beakAssistantMessage`}>
              {context.labels.done}
            </div>
          );
        } else if (message.status === "error") {
          return (
            <div key={index} className={`beakMessage beakAssistantMessage`}>
              {context.labels.error}
            </div>
          );
        }
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
