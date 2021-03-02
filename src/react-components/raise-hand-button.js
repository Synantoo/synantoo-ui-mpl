import React, { Component } from "react";
import classNames from "classnames";

export default class RaiseHandButton extends Component {
  render() {
    const btnClasses = {
      btn: true,
      "ui-meeting": true,
      "btn-light": !this.props.enabled,
      "btn-primary": this.props.enabled,
    };

    return (
      <button
        onClick={this.props.onClick}
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
