import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons/faMicrophoneSlash";
import { faLongArrowAltDown } from "@fortawesome/free-solid-svg-icons/faLongArrowAltDown";

const emptyIcon = <div className={styles.icon}></div>;

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.array,
    expanded: PropTypes.bool,
    onExpand: PropTypes.func,
    selectedRecipients: PropTypes.array,
    clearSelectedRecipients: PropTypes.func,
    toggleRecipient: PropTypes.func,
    isModerator: PropTypes.bool,
    giveVoice: PropTypes.func,
    withdrawVoice: PropTypes.func,
    handRaisedClientIds: PropTypes.array,
    voiceGivenClientIds: PropTypes.array,
    numberOfHandsUp: PropTypes.number,
  };

  renderRecipient = (presence) => {
    if (
      NAF.connection.adapter &&
      presence.clientId === NAF.connection.adapter.clientId
    ) {
      return emptyIcon;
    }
    return (
      <button
        type="button"
        className="btn btn-light btn-sm-icon"
        onClick={() => this.props.toggleRecipient(presence.clientId)}
        title={
          this.props.selectedRecipients.indexOf(presence.clientId) > -1
            ? "Remove from the recipients"
            : "Send a private message to this person"
        }
      >
        {this.props.selectedRecipients.indexOf(presence.clientId) > -1 ? (
          <i className="fs fs-chat fs-active"></i>
        ) : (
          <i className="fs fs-chat"></i>
        )}
      </button>
    );
  };

  renderHandUp = (presence) => {
    const voiceGivenToThisUser =
      this.props.voiceGivenClientIds.indexOf(presence.clientId) > -1;
    const numberInQueue =
      this.props.handRaisedClientIds.indexOf(presence.clientId) + 1;
    const handUpIcon = (
      <i
        className={classNames("fs", "fs-handup", {
          "fs-active": voiceGivenToThisUser,
        })}
      ></i>
    );

    // Don't use if presence.handup here for other than myself because
    // it may not be updated right away, use handRaisedClientIds prop.
    if (
      (presence.handup && presence.clientId === NAF.clientId) ||
      numberInQueue !== 0
    ) {
      if (this.props.isModerator && presence.clientId !== NAF.clientId) {
        return (
          <button
            type="button"
            className="btn btn-light btn-sm-icon"
            onClick={
              voiceGivenToThisUser
                ? () => this.props.withdrawVoice(presence)
                : () => this.props.giveVoice(presence)
            }
            title={
              voiceGivenToThisUser
                ? "Withdraw voice to this person"
                : "Give voice to this person"
            }
          >
            {handUpIcon}
            {numberInQueue !== 0 && (
              <span className={styles.handRaisedCounter}>{numberInQueue}</span>
            )}
          </button>
        );
      } else {
        return (
          <div className={styles.icon} title="This person wants to talk">
            {handUpIcon}
          </div>
        );
      }
    } else {
      return emptyIcon;
    }
  };

  renderRole = (presence) => {
    const moderatorIcon = <i className="fs fs-moderator fs-active"></i>;
    const notModeratorIcon = <i className="fs fs-moderator-regular"></i>;
    if (this.props.isModerator) {
      if (presence.role === "moderator") {
        if (presence.clientId === NAF.clientId) {
          return (
            <div className={styles.icon} title="This person is moderator">
              {moderatorIcon}
            </div>
          );
        } else {
          return (
            <button
              type="button"
              className="btn btn-light btn-sm-icon"
              onClick={() => this.sendDemote(presence.clientId)}
              title="Demote this person"
            >
              {moderatorIcon}
            </button>
          );
        }
      } else {
        return (
          <button
            type="button"
            className="btn btn-light btn-sm-icon"
            onClick={() => this.sendPromote(presence.clientId)}
            title="Promote this person"
          >
            {notModeratorIcon}
          </button>
        );
      }
    } else {
      if (presence.role === "moderator") {
        return (
          <div className={styles.icon} title="This person is moderator">
            {moderatorIcon}
          </div>
        );
      }
    }
    return emptyIcon;
  };

  domForPresence = (presence) => {
    const muted = presence.muted;
    const micIcon = (
      <FontAwesomeIcon
        icon={muted ? faMicrophoneSlash : faMicrophone}
        fixedWidth
      />
    );
    const awayIcon = <i className="fs fs-away"></i>;
    return (
      <div className={styles.row} key={presence.clientId}>
        {this.props.isModerator && !muted && presence.role !== "moderator" ? (
          <button
            type="button"
            className={classNames("btn", "btn-light", "btn-sm-icon", {
              "primary-color": !muted,
            })}
            onClick={() => this.sendMute(presence.clientId)}
          >
            {micIcon}
          </button>
        ) : (
          <div
            className={classNames(styles.icon, {
              "primary-color": !muted,
            })}
          >
            {micIcon}
          </div>
        )}
        {presence.away ? (
          <div className={styles.icon}>{awayIcon}</div>
        ) : (
          emptyIcon
        )}
        <div
          className={classNames({
            [styles.listItem]: true,
          })}
        >
          <span>{presence.nametag}</span>
        </div>
        {this.renderRecipient(presence)}
        {this.renderHandUp(presence)}
        {this.renderRole(presence)}
      </div>
    );
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener(
      "mouseup",
      () => {
        this.props.onExpand(false);
      },
      { once: true }
    );
  }

  sendMute(toClientId) {
    const data = { senderId: NAF.clientId, type: "action", eventType: "mute" };
    NAF.connection.sendDataGuaranteed(toClientId, "chatbox", data);
  }

  sendMuteAll = () => {
    // Set muted=true right away to not have delay to refresh the ui.
    // This modify the same object that is on player-info component data attribute,
    // it won't send this component update because we don't have the ownership,
    // and it will be overridden when the user send us back the update.
    this.props.presences.forEach((p) => {
      if (p.role !== "moderator") p.muted = true;
    });
    window.app.forceReactUpdate();
    const data = { senderId: NAF.clientId, type: "action", eventType: "mute" };
    NAF.connection.broadcastDataGuaranteed("chatbox", data);
  };

  sendPromote(toClientId) {
    const data = { type: "action", eventType: "promote" };
    NAF.connection.sendDataGuaranteed(toClientId, "chatbox", data);
  }
  sendDemote(toClientId) {
    const data = { type: "action", eventType: "demote" };
    NAF.connection.sendDataGuaranteed(toClientId, "chatbox", data);
  }

  renderExpandedList() {
    const presences = this.props.presences.sort((a, b) => {
      if (a.nametag < b.nametag) {
        return -1;
      } else if (a.nametag === b.nametag) {
        return 0;
      } else {
        return 1;
      }
    });
    return (
      <div className={styles.presenceList}>
        <div className={styles.contents}>
          <div className={styles.rows}>
            <div className={styles.row} key="header">
              {this.props.isModerator ? (
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  style={{
                    marginLeft: "-10px",
                    fontWeight: "bold",
                    padding: "0 3px",
                    boxShadow: "2px 2px 2px #ccc",
                  }}
                  onClick={this.sendMuteAll}
                >
                  Mute all
                </button>
              ) : null}
              <div
                className={classNames({
                  [styles.listItem]: true,
                })}
              ></div>
              {/* <button
                type="button"
                className="btn btn-light btn-sm-icon"
                onClick={() => this.props.clearSelectedRecipients()}
                title="Chat with everyone"
              >
                {this.props.selectedRecipients.length === 0 ? (
                  <i className="fs fs-chat fs-active"></i>
                ) : (
                  <i className="fs fs-chat"></i>
                )}
              </button> */}
              {presences.length > 1 ? (
                <div style={{ fontSize: "0.875rem", marginRight: "20px" }}>
                  chat privately with{" "}
                  <FontAwesomeIcon icon={faLongArrowAltDown} />
                </div>
              ) : null}
              {this.props.voiceGivenClientIds.length > 0 ? (
                <div
                  className={classNames(styles.icon, "primary-color")}
                  style={{ fontSize: "0.875rem" }}
                >
                  <FontAwesomeIcon icon={faLongArrowAltDown} />
                </div>
              ) : (
                emptyIcon
              )}
              {emptyIcon}
              {/* <div style={{ fontSize: "0.875rem" }}>Moderator</div> */}
            </div>
            {presences.map(this.domForPresence)}
          </div>
        </div>
      </div>
    );
  }

  render() {
    // const occupantCount = NAF.connection.adapter
    //   ? Object.keys(NAF.connection.adapter.occupants).length + 1
    //   : 0;
    const occupantCount = this.props.presences.length;
    return (
      <div>
        <button
          type="button"
          title="Members"
          aria-label={`Toggle list of ${occupantCount} member${
            occupantCount === 1 ? "" : "s"
          }`}
          onClick={() => {
            this.props.onExpand(!this.props.expanded);
          }}
          className={classNames({
            [rootStyles.presenceListButton]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded,
          })}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span className={rootStyles.occupantCount}>{occupantCount}</span>
        </button>
        {!this.props.expanded && this.props.numberOfHandsUp > 0 ? (
          <button
            type="button"
            className={classNames({
              [rootStyles.handsUpCounter]: true,
            })}
            onClick={() => {
              this.props.onExpand(!this.props.expanded);
            }}
          >
            <i className="fs fs-handup fs-active"></i>
            <span className={rootStyles.occupantCount}>
              {this.props.numberOfHandsUp}
            </span>
          </button>
        ) : null}
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
