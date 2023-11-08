import React, { ReactNode, useContext } from "react";
import { Message } from "@beakjs/core";
import { CopilotContext } from "./Copilot";
import "../css/Messages.css";

interface MessagesProps {
  inProgress: boolean;
  messages: Message[];
}

export class Messages extends React.Component<MessagesProps> {
  private messagesEndRef: React.RefObject<HTMLDivElement>;

  constructor(props: MessagesProps) {
    super(props);

    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate(_prevProps: MessagesProps) {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({
        behavior: "auto",
      });
    }
  };

  render(): ReactNode {
    return (
      <div className="beakMessages">
        {this.props.messages.map((message, index) =>
          this.renderMessage(message, index)
        )}
        <div ref={this.messagesEndRef} />
      </div>
    );
  }

  renderMessage(message: Message, index: number): ReactNode | undefined {
    if (message.role === "user") {
      return <UserMessageComponent key={index} message={message} />;
    } else if (message.role == "assistant" || message.role == "function") {
      return <AssistantMessageComponent key={index} message={message} />;
    }
  }

  static defaultProps = {};
}

const UserMessageComponent: React.FC<{
  message: Message;
}> = ({ message }) => (
  <div className="beakMessage beakUserMessage">{message.content}</div>
);

const AssistantMessageComponent: React.FC<{ message: Message }> = ({
  message,
}) => {
  const context = useContext(CopilotContext);

  if (message.role === "assistant" && message.status !== "error") {
    if (message.status === "pending" && !message.content) {
      return (
        <div className={`beakMessage beakAssistantMessage`}>
          {context.icons.spinnerIcon}
        </div>
      );
    } else if (message.status === "partial") {
      return (
        <div className={`beakMessage beakAssistantMessage`}>
          {context.messages.thinking} {context.icons.spinnerIcon}
        </div>
      );
    } else if (message.content) {
      return (
        <div className={`beakMessage beakAssistantMessage`}>
          {message.content}
        </div>
      );
    }
  } else if (message.role === "function" && message.status === "success") {
    return (
      <div className={`beakMessage beakAssistantMessage`}>
        {context.messages.done}
      </div>
    );
  } else if (message.status === "error") {
    return (
      <div className={`beakMessage beakAssistantMessage`}>
        {context.messages.error}
      </div>
    );
  }

  return <></>;
};
