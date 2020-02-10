import React, { Component } from 'react';
import './Home.css';

export default class Home extends Component {
  handleClick = () => {
    this.props.history.push('/login');
  }

  render() {
    return (
      <div className="container">
        <div className="navbar">
          <a href="/login">Login</a>
          <a>More NavBar Things</a>
        </div>
        <div className="home-content">
            <button><a href="https://www.spotify.com/us/">Spotify</a></button>
            <button>Youtube Music</button>
        </div>
      </div>
    );
  }
}
