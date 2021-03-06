import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "../assets/stylesheets/message-entry.scss";
import sendMessageIcon from "../assets/images/send_message.svgi";
import { InlineSVGButton } from "./svgi";

class LobbyChatBox extends Component {
  static propTypes = {
    occupantCount: PropTypes.number,
    onSendMessage: PropTypes.func,
  };

  state = {
    pendingMessage: "",
  };

  sendMessage = (e) => {
    e.preventDefault();
    if (this.props.onSendMessage) {
      this.props.onSendMessage(this.state.pendingMessage);
    }
    this.setState({ pendingMessage: "" });
  };

  render() {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const occupantSnippet = `${this.props.occupantCount - 1} other${
      this.props.occupantCount > 2 ? "s" : ""
    }`;
    const messageEntryPlaceholder =
      this.props.occupantCount <= 1
        ? "Nobody is here yet..."
        : `Send message to ${occupantSnippet}...`;

    return (
      <form onSubmit={this.sendMessage}>
        <div
          className={classNames({
            [styles.messageEntry]: true,
            [styles.messageEntryDisabled]: this.props.occupantCount <= 1,
          })}
          style={{ height: pendingMessageFieldHeight }}
        >
          <textarea
            className={classNames([
              styles.messageEntryInput,
              "chat-focus-target",
            ])}
            value={this.state.pendingMessage}
            rows={textRows}
            style={{ height: pendingMessageTextareaHeight }}
            onChange={(e) => this.setState({ pendingMessage: e.target.value })}
            disabled={this.props.occupantCount <= 1 ? true : false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                this.sendMessage(e);
              } else if (e.key === "Escape") {
                e.target.blur();
              }
            }}
            placeholder={messageEntryPlaceholder}
          />
          <InlineSVGButton
            className={classNames([
              styles.messageEntryButton,
              styles.messageEntrySubmit,
            ])}
            disabled={this.props.occupantCount <= 1 ? true : false}
            type="submit"
            src={sendMessageIcon}
          />
        </div>
      </form>
    );
  }
}

export default LobbyChatBox;
