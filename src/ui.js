import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import PresenceLog from "./react-components/presence-log.js";
// import PresenceList from "./react-components/presence-list.js";
import InWorldChatBox from "./react-components/in-world-chat-box.js";
import styles from "./assets/stylesheets/ui-root.scss";
import entryStyles from "./assets/stylesheets/entry.scss";
import "./assets/stylesheets/hub.scss";

let presenceLogEntries = [];
const addToPresenceLog = (entry) => {
  entry.key = Date.now().toString();

  presenceLogEntries = [...presenceLogEntries, entry];
  remountUI({ presenceLogEntries });
  //  if (entry.type === "chat" && scene.is("loaded")) {
  //    scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CHAT_MESSAGE);
  //  }

  // Fade out and then remove
  setTimeout(() => {
    entry.expired = true;
    remountUI({ presenceLogEntries });

    //    setTimeout(() => {
    //      presenceLogEntries.splice(presenceLogEntries.indexOf(entry), 1);
    //      remountUI({ presenceLogEntries });
    //    }, 5000);
  }, 20000);
};

const forceReactUpdate = () => {
  remountUI({ presenceLogEntries });
};

const fakeSendMessage = (msg, toClientId) => {
  const pseudo = localStorage.getItem("pseudo") || "Visiteur";
  addToPresenceLog({
    type: "chat",
    name: pseudo,
    toClientId: toClientId,
    body: msg,
  });
};

window.app = window.app || {};
window.app.addToPresenceLog = addToPresenceLog;
window.app.sendMessage = window.app.sendMessage || fakeSendMessage;
window.app.forceReactUpdate = forceReactUpdate;

function mountUI(scene, props = {}) {
  if (!document.body.classList.contains("entered")) return;
  const uiRoot = document.getElementById("ui-root");
  if (!uiRoot) return;
  ReactDOM.render(
    <ChatBox {...props} onSendMessage={window.app.sendMessage}></ChatBox>,
    uiRoot
  );
}

const remountUI = (props) => {
  //uiProps = { ...uiProps, ...props };
  //mountUI(scene, uiProps);
  mountUI(null, props);
};

class ChatBox extends React.Component {
  sendMessage = (msg, clientIds) => {
    if (msg.length === 0) return;
    this.props.onSendMessage(msg, clientIds);
  };

  toggleShowExpired = () => {
    this.setState((prevState) => ({ showExpired: !prevState.showExpired }));
  };

  expandExpired = (e) => {
    if (e.target.tagName === "A") return;
    this.setState(() => ({ showExpired: true }));
  };

  state = {
    expanded: false,
    showExpired: false,
  };

  onExpand = (expanded) => this.setState(() => ({ expanded: expanded }));

  render() {
    const rootStyles = {
      [styles.ui]: true,
      "ui-root": true,
      "light-theme": true,
    };
    const presences = [];
    const players = document.querySelectorAll("[player-info]");
    for (let i = 0; i < players.length; i++) {
      presences.push(players[i].components["player-info"].data);
    }
    return (
      <div className={classNames(rootStyles)}>
        {/* <PresenceList
          presences={presences}
          expanded={this.state.expanded}
          onExpand={onExpand}
        /> */}
        <PresenceLog
          expandExpired={this.expandExpired}
          showExpired={this.state.showExpired}
          entries={presenceLogEntries}
          hubId={"hub_id"}
          inRoom
        />
        <div className={entryStyles.center}>
          <InWorldChatBox
            expanded={this.state.expanded}
            onExpand={this.onExpand}
            presences={presences}
            toggleShowExpired={this.toggleShowExpired}
            showExpired={this.state.showExpired}
            onSendMessage={this.sendMessage}
          />
        </div>
      </div>
    );
  }
}
document.addEventListener("DOMContentLoaded", function() {
  const scene = document.querySelector("a-scene");
  scene.addEventListener("entered", function() {
    mountUI();
  });
});
