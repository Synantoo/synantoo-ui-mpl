import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
//import { FormattedMessage } from "react-intl";

import ChatMessage from "./chat-message";
//import PhotoMessage from "./photo-message";
//import VideoMessage from "./video-message";
//import ImageMessage from "./image-message";

export default class PresenceLog extends Component {
  static propTypes = {
    expandExpired: PropTypes.func,
    entries: PropTypes.array,
    inRoom: PropTypes.bool,
    hubId: PropTypes.string,
    showExpired: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.messagesEndRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (
      !this.props.showExpired &&
      (this.props.entries.length !== prevProps.entries.length ||
        this.props.showExpired !== prevProps.showExpired)
    ) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    this.messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  domForEntry = (e) => {
    const entryClasses = {
      [styles.presenceLogEntry]: true,
      [styles.presenceLogEntryWithButton]:
        (e.type === "chat" || e.type === "image") && e.maySpawn,
      [styles.presenceLogChat]: e.type === "chat",
      [styles.expired]: this.props.showExpired ? false : !!e.expired,
    };

    const isBot = false;

    switch (e.type) {
      case "join":
      case "entered":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;
            <FormattedMessage id={`presence.${e.type}_${e.presence}`} />
          </div>
        );
      case "leave":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;
            <FormattedMessage id={`presence.${e.type}`} />
          </div>
        );
      case "display_name_changed":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.oldName}</b>&nbsp;
            <FormattedMessage id="presence.name_change" />
            &nbsp;<b>{e.newName}</b>.
          </div>
        );
      case "scene_changed":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;
            <FormattedMessage id="presence.scene_change" />
            &nbsp;<b>{e.sceneName}</b>.
          </div>
        );
      case "hub_name_changed":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;
            <FormattedMessage id="presence.hub_name_change" />
            &nbsp;<b>{e.hubName}</b>.
          </div>
        );
      case "chat":
        let name = e.name;
        // if (e.toClientId) {
        //   name = `${e.name} (in private)`;
        // }

        return (
          <ChatMessage
            onClick={this.props.expandExpired}
            key={e.key}
            name={name}
            className={classNames(entryClasses)}
            body={e.body}
            maySpawn={e.maySpawn}
            sessionId={e.sessionId}
            includeFromLink={this.props.inRoom && !isBot}
          />
        );
      //      case "image":
      //        return (
      //          <ImageMessage
      //            key={e.key}
      //            name={e.name}
      //            className={classNames(entryClasses, styles.media)}
      //            body={e.body}
      //            maySpawn={e.maySpawn}
      //          />
      //        );
      //      case "photo":
      //        return (
      //          <PhotoMessage
      //            key={e.key}
      //            name={e.name}
      //            className={classNames(entryClasses, styles.media)}
      //            body={e.body}
      //            maySpawn={e.maySpawn}
      //            hubId={this.props.hubId}
      //          />
      //        );
      //      case "video":
      //        return (
      //          <VideoMessage
      //            key={e.key}
      //            name={e.name}
      //            className={classNames(entryClasses, styles.media)}
      //            body={e.body}
      //            maySpawn={e.maySpawn}
      //            hubId={this.props.hubId}
      //          />
      //        );
      case "log":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            {e.body}
          </div>
        );
    }
  };

  render() {
    const presenceClasses = {
      [styles.presenceLog]: true,
      [styles.presenceLogInRoom]: this.props.inRoom,
      [styles.presenceLogInRoomSelected]: this.props.showExpired,
      "presence-log-selected": this.props.showExpired,
    };

    return (
      <div id="presence-log" className={classNames(presenceClasses)}>
        {this.props.entries.map(this.domForEntry)}
        <div ref={this.messagesEndRef} />
      </div>
    );
  }
}
