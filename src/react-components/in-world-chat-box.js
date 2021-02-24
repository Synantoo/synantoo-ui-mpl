import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "../assets/stylesheets/message-entry.scss";
import sendMessageIcon from "../assets/images/send_message.svgi";
import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  handleTextFieldFocus,
  handleTextFieldBlur,
} from "../utils/focus-utils";
import PresenceList from "./presence-list.js";
import { InlineSVGButton } from "./svgi";

const isMobile = AFRAME.utils.device.isMobile();

class InWorldChatBox extends Component {
  static propTypes = {
    expanded: PropTypes.bool,
    onExpand: PropTypes.func,
    presences: PropTypes.array,
    onSendMessage: PropTypes.func,
    onObjectCreated: PropTypes.func,
    history: PropTypes.object,
    enableSpawning: PropTypes.bool,
    toggleShowExpired: PropTypes.func,
  };

  state = {
    selectedRecipients: [],
    selectedRecipientsNames: [],
    pendingMessage: "",
  };

  sendMessage = (e) => {
    e.preventDefault();
    if (!this.state.pendingMessage) {
      return;
    }
    if (this.props.onSendMessage) {
      let msg = this.state.pendingMessage;
      if (this.state.selectedRecipients.length > 0) {
        const recipientIds = [];
        const recipientNames = [];
        this.state.selectedRecipients.forEach((clientId) => {
          const nametag = this.props.presences.find(
            (p) => p.clientId === clientId
          )?.nametag;
          if (nametag) {
            recipientIds.push(clientId);
            recipientNames.push(nametag);
          }
        });
        msg = `@${recipientNames.join(" @")} (in private) ${msg}`;
        this.props.onSendMessage(msg, recipientIds);
      } else {
        this.props.onSendMessage(msg, null);
      }

      // close present list if currently open
      if (this.props.expanded) this.props.onExpand(false);
    }
    this.setState({ pendingMessage: "" });
  };

  clearSelectedRecipients = () => {
    this.setState(
      (prevState) => {
        return { selectedRecipients: [], selectedRecipientsNames: [] };
      },
      () => {
        const chatInput = document.querySelector(".chat-focus-target");
        if (chatInput) chatInput.focus();
      }
    );
  };

  toggleRecipient = (clientId) => {
    this.setState(
      (prevState) => {
        let selectedRecipients;
        if (prevState.selectedRecipients.indexOf(clientId) > -1) {
          selectedRecipients = prevState.selectedRecipients.filter(
            (c) => c !== clientId
          );
        } else {
          selectedRecipients = [...prevState.selectedRecipients, clientId];
        }

        const recipientNames = [];
        selectedRecipients.forEach((clientId) => {
          const nametag = this.props.presences.find(
            (p) => p.clientId === clientId
          )?.nametag;
          if (nametag) {
            recipientNames.push(nametag);
          }
        });
        return {
          selectedRecipients: selectedRecipients,
          selectedRecipientsNames: recipientNames,
        };
      },
      () => {
        const chatInput = document.querySelector(".chat-focus-target");
        if (chatInput) chatInput.focus();
      }
    );
  };

  render() {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const isModerator = window.app.isModerator
      ? window.app.isModerator()
      : false;

    return (
      <form onSubmit={this.sendMessage}>
        <div
          id="message-entry"
          className={classNames({
            [styles.messageEntryInRoom]: true,
            [styles.messageEntryOnMobile]: isMobile,
          })}
          style={{ height: pendingMessageFieldHeight }}
        >
          <PresenceList
            toggleRecipient={this.toggleRecipient}
            clearSelectedRecipients={this.clearSelectedRecipients}
            selectedRecipients={this.state.selectedRecipients}
            presences={this.props.presences}
            expanded={this.props.expanded}
            onExpand={this.props.onExpand}
            isModerator={isModerator}
          />
          <input
            id="message-entry-media-input"
            type="file"
            style={{ display: "none" }}
            accept={isMobile ? "image/*" : "*"}
            multiple
            onChange={(e) => {
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
            title={
              this.props.showExpired ? "Hide old messages" : "Show old messages"
            }
            className={classNames(
              [
                styles.messageEntryButton,
                styles.messageEntryButtonInRoom,
                styles.messageEntryButtonHistory,
              ]
              // {
              //   [styles.messageEntryButtonHistorySelected]: this.props
              //     .showExpired,
              // }
            )}
          >
            <i>
              {this.props.showExpired ? (
                <FontAwesomeIcon icon={faChevronDown} />
              ) : (
                <FontAwesomeIcon icon={faChevronUp} />
              )}
            </i>
          </button>
          {this.props.enableSpawning && (
            <label
              htmlFor="message-entry-media-input"
              title={"Upload"}
              className={classNames([
                styles.messageEntryButton,
                styles.messageEntryButtonInRoom,
                styles.messageEntryUpload,
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
              !this.props.enableSpawning && styles.messageEntryInputNoSpawn,
            ])}
            value={this.state.pendingMessage}
            rows={textRows}
            onFocus={(e) => {
              handleTextFieldFocus(e.target);
            }}
            onBlur={() => {
              handleTextFieldBlur();
            }}
            onChange={(e) => {
              e.stopPropagation();
              this.setState({ pendingMessage: e.target.value });
            }}
            onKeyDown={(e) => {
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
            placeholder={
              this.state.selectedRecipients.length === 0
                ? `Chat with everyone`
                : `Chat with selected persons`
            }
          />
          {this.state.selectedRecipientsNames.length > 0 ? (
            <div className={styles.selectedRecipients}>
              <span>in private to</span>{" "}
              {this.state.selectedRecipientsNames.join(", ")}
            </div>
          ) : null}
          <InlineSVGButton
            type="submit"
            title={"Submit"}
            className={classNames([
              styles.messageEntryButton,
              styles.messageEntryButtonInRoom,
              styles.messageEntrySubmit,
            ])}
            src={sendMessageIcon}
          />
        </div>
      </form>
    );
  }
}

export default InWorldChatBox;
