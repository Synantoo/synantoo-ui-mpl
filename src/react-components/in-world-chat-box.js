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
import RaiseHandButton from "./raise-hand-button";
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
    currentClientTalking: null,
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

  sendYouCanTalk = (presence) => {
    const pseudo = localStorage.getItem("pseudo");
    const msg = `Moderator ${pseudo} gave voice to you, you can unmute yourself to talk.`;
    const data = { type: "log", toClientId: presence.clientId, body: msg };
    NAF.connection.sendDataGuaranteed(presence.clientId, "chatbox", data);
    this.setState(() => ({ currentClientTalking: presence.clientId }));
  };

  sendStopTalking = (presence) => {
    // const pseudo = localStorage.getItem("pseudo");
    // const msg = `Moderator ${pseudo} put you on mute.`;
    // const data = { type: "log", toClientId: presence.clientId, body: msg };
    // NAF.connection.sendDataGuaranteed(presence.clientId, "chatbox", data);
    const data = { type: "action", eventType: "handDown" };
    NAF.connection.sendDataGuaranteed(presence.clientId, "chatbox", data);
    this.setState(() => ({ currentClientTalking: null }));
  };

  render() {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const isModerator = window.app.isModerator
      ? window.app.isModerator()
      : false;

    const presencesHandUp = this.props.presences.filter((p) => {
      return p.handup;
    });
    let firstPresenceHandUp = null;
    if (this.state.currentClientTalking !== null) {
      firstPresenceHandUp = presencesHandUp.find((p) => {
        return p.clientId === this.state.currentClientTalking;
      });
    }
    if (!firstPresenceHandUp) {
      firstPresenceHandUp =
        presencesHandUp.length > 0 ? presencesHandUp[0] : null;
    }

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
              <span>chat privately with</span>{" "}
              {this.state.selectedRecipientsNames.join(", ")}
            </div>
          ) : null}
          {isModerator && firstPresenceHandUp ? (
            <div className={styles.selectedRecipients}>
              {this.state.currentClientTalking ===
              firstPresenceHandUp.clientId ? (
                <>
                  <span>voice given to {firstPresenceHandUp.nametag}</span>{" "}
                  {/* <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => this.sendStopTalking(firstPresenceHandUp)}
                  >
                    STOP
                  </button> */}
                </>
              ) : (
                <>
                  <span>give voice to {firstPresenceHandUp.nametag}</span>{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => this.sendYouCanTalk(firstPresenceHandUp)}
                  >
                    OK
                  </button>
                </>
              )}
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
          <RaiseHandButton />
        </div>
      </form>
    );
  }
}

export default InWorldChatBox;
