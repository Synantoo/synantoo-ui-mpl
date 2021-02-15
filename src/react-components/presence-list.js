import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons/faMicrophoneSlash";
import { faUserAltSlash } from "@fortawesome/free-solid-svg-icons/faUserAltSlash";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons/faPaperPlane";

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.array,
    expanded: PropTypes.bool,
    onExpand: PropTypes.func,
    setSelectedRecipient: PropTypes.func,
  };

  renderRecipient = (presence) => {
    if (
      NAF.connection.adapter &&
      presence.clientId === NAF.connection.adapter.clientId
    ) {
      return null;
    }
    return (
      <div
        key={presence.clientId}
        onClick={() => this.props.setSelectedRecipient(presence)}
      >
        {this.props.selectedRecipient === presence.clientId ? (
          <FontAwesomeIcon
            icon={faPaperPlane}
            className={classNames({
              [styles.privateMessage]: true,
              [styles.privateMessageSelected]: true,
            })}
            title="Remove from the recipients"
          />
        ) : (
          <FontAwesomeIcon
            icon={faPaperPlane}
            className={styles.privateMessage}
            title="Send a private message to this person"
          />
        )}
      </div>
    );
  };

  domForPresence = (presence) => {
    const icon = (
      <FontAwesomeIcon
        icon={presence.muted ? faMicrophoneSlash : faMicrophone}
        fixedWidth
      />
    );
    const awayIcon = <FontAwesomeIcon icon={faUserAltSlash} title="Away" />;
    return (
      <div className={styles.row} key={presence.clientId}>
        <div className={styles.icon}>{icon}</div>
        {presence.away ? <div className={styles.icon}>{awayIcon}</div> : null}
        <div
          className={classNames({
            [styles.listItem]: true,
          })}
        >
          <span>{presence.nametag}</span>
        </div>
        {this.renderRecipient(presence)}
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

  renderExpandedList() {
    return (
      <div className={styles.presenceList}>
        {/* <div className={styles.attachPoint} /> */}
        <div className={styles.contents}>
          <div className={styles.rows}>
            {this.props.presences.map(this.domForPresence)}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const occupantCount = NAF.connection.adapter
      ? Object.keys(NAF.connection.adapter.occupants).length + 1
      : 0;
    const avatarEnabled = document.getElementById("remote-avatar") !== null;
    return (
      <div>
        <button
          title="Members"
          aria-label={`Toggle list of ${occupantCount} member${
            occupantCount === 1 ? "" : "s"
          }`}
          onClick={
            avatarEnabled
              ? () => {
                  this.props.onExpand(!this.props.expanded);
                }
              : null
          }
          style={!avatarEnabled ? { cursor: "auto" } : null}
          className={classNames({
            [rootStyles.presenceListButton]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded,
          })}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span className={rootStyles.occupantCount}>{occupantCount}</span>
        </button>
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
