import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons/faMicrophoneSlash";

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
    const handUpIcon = <i className="fs fs-handup"></i>;
    if (presence.handup) {
      return (
        <div className={styles.icon} title="This person wants to talk">
          {handUpIcon}
        </div>
      );
    } else {
      return emptyIcon;
    }
  };

  renderRole = (presence) => {
    const moderatorIcon = <i className="fs fs-moderator"></i>;
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
    const micIcon = (
      <FontAwesomeIcon
        icon={presence.muted ? faMicrophoneSlash : faMicrophone}
        fixedWidth
      />
    );
    const awayIcon = <i className="fs fs-away"></i>;
    return (
      <div className={styles.row} key={presence.clientId}>
        {this.props.isModerator &&
        !presence.muted &&
        presence.role !== "moderator" ? (
          <button
            type="button"
            className="btn btn-light btn-sm-icon"
            onClick={() => this.sendMute(presence.clientId)}
          >
            {micIcon}
          </button>
        ) : (
          <div className={styles.icon}>{micIcon}</div>
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
    const data = { type: "action", eventType: "mute" };
    NAF.connection.sendDataGuaranteed(toClientId, "chatbox", data);
  }

  sendMuteAll(e) {
    e.preventDefault();
    const data = { type: "action", eventType: "mute" };
    NAF.connection.broadcastDataGuaranteed("chatbox", data);
  }

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
                  <i className="fas fa-long-arrow-alt-down"></i>
                </div>
              ) : null}
              {emptyIcon}
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
    const occupantCount = NAF.connection.adapter
      ? Object.keys(NAF.connection.adapter.occupants).length + 1
      : 0;
    let numberOfHandsUp = 0;
    this.props.presences.forEach((p) => {
      if (p.handup) numberOfHandsUp += 1;
    });
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
        {!this.props.expanded && numberOfHandsUp > 0 ? (
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
            <span className={rootStyles.occupantCount}>{numberOfHandsUp}</span>
          </button>
        ) : null}
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
