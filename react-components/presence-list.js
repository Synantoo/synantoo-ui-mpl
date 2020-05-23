import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faDesktop } from "@fortawesome/free-solid-svg-icons/faDesktop";
import { InlineSVG } from "./svgi";

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.object,
    expanded: PropTypes.bool,
    onExpand: PropTypes.func
  };

  domForPresence = (presence) => {
    const icon = <FontAwesomeIcon icon={faDesktop} />;
    return (
        <div className={styles.row}>
          <div className={styles.icon}>
            <i>{icon}</i>
          </div>
          <div
            className={classNames({
              [styles.listItem]: true
            })}
          >
           <span>{presence.nametag}</span>
          </div>
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
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>
            {this.props.presences
              .map(this.domForPresence)}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const occupantCount = NAF.connection.adapter ? Object.keys(NAF.connection.adapter.occupants).length + 1 : 0;
    return (
      <div>
        <button
          title="Members"
          aria-label={`Toggle list of ${occupantCount} member${occupantCount === 1 ? "" : "s"}`}
          onClick={() => {
            this.props.onExpand(!this.props.expanded);
          }}
          className={classNames({
            [rootStyles.presenceListButton]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded
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
