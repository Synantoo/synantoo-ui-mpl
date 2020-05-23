import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import PresenceLog from "./react-components/presence-log.js";
import PresenceList from "./react-components/presence-list.js";
import InWorldChatBox from "./react-components/in-world-chat-box.js";
import styles from "./assets/stylesheets/ui-root.scss";
import entryStyles from "./assets/stylesheets/entry.scss";
import "./assets/stylesheets/hub.scss";

const presenceLogEntries = [];
const addToPresenceLog = entry => {
  entry.key = Date.now().toString();

  presenceLogEntries.push(entry);
  remountUI({ presenceLogEntries });
//  if (entry.type === "chat" && scene.is("loaded")) {
//    scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CHAT_MESSAGE);
//  }

  // Fade out and then remove
  setTimeout(() => {
    entry.expired = true;
    remountUI({ presenceLogEntries });

    setTimeout(() => {
//      presenceLogEntries.splice(presenceLogEntries.indexOf(entry), 1);
      remountUI({ presenceLogEntries });
    }, 5000);
  }, 20000);
};

const fakeSendMessage = (msg) => {
  const pseudo = localStorage.getItem('pseudo') || 'Visiteur';
  addToPresenceLog({ type: "chat", name: pseudo, body: msg });
}

window.app = window.app || {};
window.app.addToPresenceLog = addToPresenceLog;
window.app.sendMessage = window.app.sendMessage || fakeSendMessage;

function mountUI(scene, props = {}) {
  ReactDOM.render(<ChatBox { ...props } onSendMessage={window.app.sendMessage}></ChatBox>, document.getElementById("ui-root"));
}

const remountUI = props => {
  //uiProps = { ...uiProps, ...props };
  //mountUI(scene, uiProps);
  mountUI(null, props);
};

class ChatBox extends React.Component {
  sendMessage = msg => {
    if (msg.length === 0) return;
    this.props.onSendMessage(msg);
  };

  state = {
    expanded: false
  }

  render() {
    const rootStyles = {
        [styles.ui]: true,
        "ui-root": true,
        'light-theme': true
    }
    const onExpand = (expanded) => this.setState({ expanded: expanded });
    const presences = [];
    const players = document.querySelectorAll('[player-info]');
    for (let i = 0; i < players.length; i++) {
      presences.push(players[i].components['player-info'].data);
    }
    return (
      <div className={classNames(rootStyles)}>
        <PresenceList
          presences={presences}
          expanded={this.state.expanded}
          onExpand={onExpand}
        />
        <PresenceLog
          entries={presenceLogEntries}
          hubId={"hub_id"}
          inRoom
        />
        <div className={entryStyles.center}>
          <InWorldChatBox
            discordBridges={[]}
            onSendMessage={this.sendMessage}
          />
        </div>
      </div>
    );
  }
}
document.addEventListener('DOMContentLoaded', function() {
  const scene = document.querySelector('a-scene');
  scene.addEventListener('entered', function() {
    mountUI();
  });
});
