import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "../assets/stylesheets/message-entry.scss";
import sendMessageIcon from "../assets/images/send_message.svgi";
import { faAt } from "@fortawesome/free-solid-svg-icons/faAt";
import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faHistory } from "@fortawesome/free-solid-svg-icons/faHistory";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
//import { spawnChatMessage } from "./chat-message";
import { InlineSVGButton } from "./svgi";

const isMobile = AFRAME.utils.device.isMobile();

class InWorldChatBox extends Component {
  static propTypes = {
    presences: PropTypes.array,
    discordBridges: PropTypes.array,
    onSendMessage: PropTypes.func,
    onObjectCreated: PropTypes.func,
    history: PropTypes.object,
    enableSpawning: PropTypes.bool,
    toggleShowExpired: PropTypes.func
  };

  state = {
    showRecipients: false,
    selectedRecipient: "",
    selectedRecipientName: "room",
    pendingMessage: ""
  };

  sendMessage = e => {
    e.preventDefault();
    if (!this.state.pendingMessage) {
      return;
    }
    if (this.props.onSendMessage) {
      let msg = this.state.pendingMessage;
      if (this.state.selectedRecipient) {
        msg = `@${this.state.selectedRecipientName} ${msg}`;
      }
      this.props.onSendMessage(msg, this.state.selectedRecipient);
    }
    this.setState({ pendingMessage: "" });
  };

  toggleRecipients = () => {
    this.setState((prevState) => ({showRecipients: !prevState.showRecipients}));
  }

  renderRecipient = (presence) => {
    if (NAF.connection.adapter && presence.clientId === NAF.connection.adapter.clientId) {
        return null;
    }
    return (
      <div key={presence.clientId} className={styles.recipientRow} onClick={() => this.setSelectedRecipient(presence)}>
        {this.state.selectedRecipient === presence.clientId && (
          <i>
            <FontAwesomeIcon icon={faCheck} />
          </i>
        )}
        <span>{presence.nametag}</span>
      </div>
    );
  };

  setSelectedRecipient = (presence) => {
    this.setState((prevState) => {
      if (prevState.selectedRecipient === presence.clientId) {
        return {selectedRecipient: "", selectedRecipientName: "room"};
      } else {
        return {selectedRecipient: presence.clientId, selectedRecipientName: presence.nametag};
      }
    }, this.toggleRecipients);
  };

  render() {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const discordSnippet = this.props.discordBridges.map(ch => "#" + ch).join(", ");

    return (
      <form onSubmit={this.sendMessage}>
        <div
          className={classNames({ [styles.messageEntryInRoom]: true, [styles.messageEntryOnMobile]: isMobile })}
          style={{ height: pendingMessageFieldHeight }}
        >
          <input
            id="message-entry-media-input"
            type="file"
            style={{ display: "none" }}
            accept={isMobile ? "image/*" : "*"}
            multiple
            onChange={e => {
              if (this.props.onObjectCreated) {
                for (const file of e.target.files) {
                  this.props.onObjectCreated(file);
                }
              }
            }}
          />
          <button
            type="button"
            onClick={this.props.toggleShowExpired}
            title={this.props.showExpired ? "Hide old messages" : "Show old messages"}
            className={classNames([
              styles.messageEntryButton,
              styles.messageEntryButtonInRoom,
              styles.messageEntryHistory,
            ],
            {[styles.messageEntryButtonInRoomSelected]: this.props.showExpired}
            )}
          >
            <i>
              <FontAwesomeIcon icon={faHistory} />
            </i>
          </button>
          <button
            type="button"
            onClick={this.toggleRecipients}
            title={this.state.selectedRecipient ? "This will send a private message to this user" : "You can send a private message"}
            className={classNames([
              styles.messageEntryButton,
              styles.messageEntryButtonInRoom,
            ],
            {[styles.messageEntryButtonInRoomSelected]: this.state.selectedRecipient || this.state.showRecipients}
            )}
          >
            <i>
              <FontAwesomeIcon icon={faAt} />
            </i>
          </button>
          {this.state.showRecipients && (
            <div className={styles.recipients}>
              {this.renderRecipient({nametag: "room", clientId: ""})}
              {this.props.presences
                .map(this.renderRecipient)}
            </div>)}
          {this.props.enableSpawning && (
            <label
              htmlFor="message-entry-media-input"
              title={"Upload"}
              className={classNames([
                styles.messageEntryButton,
                styles.messageEntryButtonInRoom,
                styles.messageEntryUpload
              ])}
            >
              <i>
                <FontAwesomeIcon icon={isMobile ? faCamera : faPlus} />
              </i>
            </label>
          )}
          <textarea
            style={{ height: pendingMessageTextareaHeight }}
            className={classNames([
              styles.messageEntryInput,
              styles.messageEntryInputInRoom,
              "chat-focus-target",
              !this.props.enableSpawning && styles.messageEntryInputNoSpawn
            ])}
            value={this.state.pendingMessage}
            rows={textRows}
            onFocus={e => {
              handleTextFieldFocus(e.target);
            }}
            onBlur={() => {
              handleTextFieldBlur();
            }}
            onChange={e => {
              e.stopPropagation();
              this.setState({ pendingMessage: e.target.value });
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
                this.sendMessage(e);
//              } else if (e.key === "Enter" && e.ctrlKey) {
//                spawnChatMessage(e.target.value);
//                this.setState({ pendingMessage: "" });
//                e.target.blur();
              } else if (e.key === "Escape") {
                e.target.blur();
              }
            }}
            placeholder={this.props.discordBridges.length ? `Send to room and ${discordSnippet}...` : `Send to ${this.state.selectedRecipientName}...`}
          />
          <InlineSVGButton
            type="submit"
            title={"Submit"}
            className={classNames([
              styles.messageEntryButton,
              styles.messageEntryButtonInRoom,
              styles.messageEntrySubmit
            ])}
            src={sendMessageIcon}
          />
        </div>
      </form>
    );
  }
}

export default InWorldChatBox;
