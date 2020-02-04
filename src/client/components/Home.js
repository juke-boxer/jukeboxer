import React, { Component } from 'react';

export default class Home extends Component {
  handleClick = () => {
    this.props.history.push('/login');
  }

  render() {
    return (
      <div>
        <p>HOME PAGE!</p>
        <button type="button" onClick={this.handleClick}>Login</button>
      </div>
    );
  }
}
