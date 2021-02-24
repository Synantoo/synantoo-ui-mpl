import React, { Component } from "react";
import classNames from "classnames";

export default class RaiseHandButton extends Component {
  state = {
    enabled: false,
  };

  onClick = () => {
    this.setState(
      (prevState) => ({
        enabled: !prevState.enabled,
      }),
      () => {
        document
          .getElementById("cameraRig")
          .setAttribute("player-info", { handup: this.state.enabled });
        if (this.state.enabled) {
          if (typeof _paq !== "undefined")
            _paq.push(["trackEvent", "Interactions", "Hand Up"]);
        } else {
          if (typeof _paq !== "undefined")
            _paq.push(["trackEvent", "Interactions", "Hand Down"]);
        }
      }
    );
  };

  render() {
    const btnClasses = {
      btn: true,
      "ui-meeting": true,
      "btn-light": !this.state.enabled,
      "btn-primary": this.state.enabled,
    };

    return (
      <button
        onClick={this.onClick}
        id="handUpBtn"
        className={classNames(btnClasses)}
        style={{ margin: "0 5px" }}
        type="button"
        title="Raise your hand if you want to talk"
      >
        <i className="fs fs-handup fa-fw"></i>
      </button>
    );
  }
}
