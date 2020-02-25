import React, { Component } from 'react';
import './Home.css';

export default class Home extends Component {
  constructor(props) {
    super(props);
    document.title = 'Jukeboxer';
  }

  handleClick = (nav_bar_url) => {
    this.props.history.push(nav_bar_url);
  }

  render() {
    return (
      <div className="container">
        <div className="navbar">
          <a href="" onClick={() => { this.handleClick('login')} }>Login</a>
          <a href="" onClick={() => { this.handleClick('spotify-test')} }>Spotify</a>
        </div>
        <div className="home-content">
          <a href="https://jukeboxer-capstone.herokuapp.com/spotify-test/"><button>Spotify</button></a>
          <a href="https://music.youtube.com/"><button>Youtube Music</button></a>
        </div>
      </div>
    );
  }
}
