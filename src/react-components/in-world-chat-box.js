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
    inputHasFocus: false,
    selectedRecipients: [],
    selectedRecipientsNames: [],
    pendingMessage: "",
    voiceGivenClientIds: [],
    voiceWithdrawnClientIds: [],
    voiceGiven: false,
    handRaised: false,
  };

  componentDidMount() {
    const scene = document.querySelector("a-scene");
    scene.addEventListener("voiceGiven", this.voiceGiven);
    scene.addEventListener("voiceWithdrawn", this.voiceWithdrawn);
  }

  componentWillUnmount() {
    const scene = document.querySelector("a-scene");
    if (scene) {
      scene.removeEventListener("voiceGiven", this.voiceGiven);
      scene.removeEventListener("voiceWithdrawn", this.voiceWithdrawn);
    }
  }

  toggleHand = () => {
    this.setState(
      (prevState) => {
        if (prevState.handRaised) {
          return { handRaised: false, voiceGiven: false };
        } else {
          return { handRaised: true };
        }
      },
      () => {
        document
          .getElementById("cameraRig")
          .setAttribute("player-info", { handup: this.state.handRaised });
        if (this.state.handRaised) {
          if (typeof _paq !== "undefined")
            _paq.push(["trackEvent", "Interactions", "Hand Up"]);
        } else {
          // mute the mic
          window.app.updateMicStatus(false);
          if (typeof _paq !== "undefined")
            _paq.push(["trackEvent", "Interactions", "Hand Down"]);
        }
      }
    );
  };

  voiceGiven = () => {
    this.setState(() => ({ voiceGiven: true }));
  };

  voiceWithdrawn = () => {
    // mute the mic
    window.app.updateMicStatus(false);
    this.setState(
      () => ({ handRaised: false, voiceGiven: false }),
      () => {
        document
          .getElementById("cameraRig")
          .setAttribute("player-info", { handup: this.state.handRaised });
      }
    );
  };

  getNameForClientId = (clientId) => {
    const nametag = this.props.presences.find((p) => p.clientId === clientId)
      ?.nametag;
    return nametag;
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
          const nametag = this.getNameForClientId(clientId);
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
          const nametag = this.getNameForClientId(clientId);
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

  giveVoice = (presence) => {
    const data = {
      type: "action",
      eventType: "giveVoice",
      fromClientId: NAF.clientId,
      toClientId: presence.clientId,
    };
    NAF.connection.sendDataGuaranteed(presence.clientId, "chatbox", data);
    this.setState((prevState) => ({
      voiceGivenClientIds: [
        ...prevState.voiceGivenClientIds,
        presence.clientId,
      ],
    }));
  };

  withdrawVoice = (presence) => {
    const data = {
      type: "action",
      eventType: "withdrawVoice",
      fromClientId: NAF.clientId,
      toClientId: presence.clientId,
    };
    NAF.connection.sendDataGuaranteed(presence.clientId, "chatbox", data);
    this.setState((prevState) => ({
      voiceGivenClientIds: prevState.voiceGivenClientIds.filter(
        (clientId) => clientId !== presence.clientId
      ),
      voiceWithdrawnClientIds: [
        ...prevState.voiceWithdrawnClientIds,
        presence.clientId,
      ],
    }));
  };

  static getDerivedStateFromProps(props, state) {
    if (
      props.presences !== state.prevPropsPresences ||
      state.voiceGivenClientIds !== state.prevVoiceGivenClientIds
    ) {
      let presencesHandUp = props.presences.filter((p) => {
        return (
          p.handup &&
          p.clientId !== NAF.clientId &&
          state.voiceWithdrawnClientIds.indexOf(p.clientId) === -1
        );
      });

      const voiceGivenClientIds = state.voiceGivenClientIds.filter(
        (clientId) => {
          const presence = presencesHandUp.find((p) => {
            return p.clientId === clientId;
          });
          // the user lowered their hand, remove it from the list
          if (presence) {
            return true;
          } else {
            return false;
          }
        }
      );

      // sort presencesHandUp by voiceGivenClientIds
      presencesHandUp.sort((a, b) => {
        let indexA = voiceGivenClientIds.indexOf(a.clientId);
        let indexB = voiceGivenClientIds.indexOf(b.clientId);
        if (indexA > -1 && indexB > -1) {
          return indexA < indexB ? -1 : 1;
        } else if (indexA > -1) {
          return -1;
        } else if (indexB > -1) {
          return 1;
        } else {
          if (state.handRaisedClientIds) {
            indexA = state.handRaisedClientIds.indexOf(a.clientId);
            indexB = state.handRaisedClientIds.indexOf(b.clientId);
            console.log(state.handRaisedClientIds, indexA, indexB);
            if (indexA > -1 && indexB > -1) {
              return indexA < indexB ? -1 : 1;
            } else if (indexA > -1) {
              return -1;
            } else if (indexB > -1) {
              return 1;
            } else {
              return -1; // don't change order
            }
          } else {
            return -1; // don't change order
          }
        }
      });

      // keep clientIds of user we withdrawn until they lower their hand and we get the update
      const voiceWithdrawnClientIds = state.voiceWithdrawnClientIds.filter(
        (clientId) => {
          const presence = props.presences.find((p) => {
            return p.clientId === clientId && !p.handup;
          });
          if (presence) {
            return false;
          } else {
            return true;
          }
        }
      );

      return {
        prevPropsPresences: props.presences,
        prevVoiceGivenClientIds: voiceGivenClientIds,
        handRaisedClientIds: presencesHandUp.map((p) => p.clientId),
        voiceGivenClientIds: voiceGivenClientIds,
        voiceWithdrawnClientIds: voiceWithdrawnClientIds,
        nextPresenceHandUp:
          presencesHandUp.length > 0 ? presencesHandUp[0] : null,
      };
    }
    return null;
  }

  render() {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const isModerator = window.app.isModerator
      ? window.app.isModerator()
      : false;

    let nextPresenceHandUp = this.state.nextPresenceHandUp;

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
            giveVoice={this.giveVoice}
            withdrawVoice={this.withdrawVoice}
            handRaisedClientIds={this.state.handRaisedClientIds}
            voiceGivenClientIds={this.state.voiceGivenClientIds}
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
              this.setState(() => ({ inputHasFocus: true }));
            }}
            onBlur={() => {
              handleTextFieldBlur();
              this.setState(() => ({ inputHasFocus: false }));
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
          {this.state.inputHasFocus &&
          this.state.selectedRecipientsNames.length > 0 ? (
            <div className={styles.selectedRecipients}>
              <span>chat privately with</span>{" "}
              <span>{this.state.selectedRecipientsNames.join(", ")}</span>
            </div>
          ) : null}
          {isModerator && nextPresenceHandUp ? (
            <div
              className={classNames(styles.selectedRecipients, {
                [styles.selectedRecipientsPaddingLeft]: !this.props.expanded,
              })}
            >
              {this.state.voiceGivenClientIds.indexOf(
                nextPresenceHandUp.clientId
              ) > -1 ? (
                <>
                  <span>voice given to {nextPresenceHandUp.nametag}</span>
                  {this.state.voiceGivenClientIds.length === 1 ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => this.withdrawVoice(nextPresenceHandUp)}
                      >
                        STOP
                      </button>
                    </>
                  ) : (
                    <span>, ...</span>
                  )}
                </>
              ) : (
                <>
                  <span>give voice to {nextPresenceHandUp.nametag}</span>{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => this.giveVoice(nextPresenceHandUp)}
                  >
                    OK
                  </button>
                </>
              )}
            </div>
          ) : null}
          {this.state.voiceGiven ? (
            <div
              className={classNames(styles.selectedRecipients, {
                [styles.selectedRecipientsPaddingLeft]: !this.props.expanded,
              })}
            >
              <>
                <span>Moderator gave voice to you.</span>
                {!window.app.voice ? (
                  <>
                    <span>You can unmute yourself to talk.</span>{" "}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => window.app.updateMicStatus(true)}
                    >
                      UNMUTE
                    </button>
                  </>
                ) : (
                  <span>Lower your hand when you finished talking.</span>
                )}
              </>
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
          <RaiseHandButton
            onClick={this.toggleHand}
            enabled={this.state.handRaised}
          />
        </div>
      </form>
    );
  }
}

export default InWorldChatBox;
