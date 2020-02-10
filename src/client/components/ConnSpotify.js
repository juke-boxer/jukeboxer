import React, { Component } from 'react';
import './connSpotify.css';

let defaultStyle = {
  color: '#fff'
};
let fakeServerData = {
  user: {
    name: 'Aaron',
    playlists: [
      {
        name: "Favorites",
        songs: [{name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500},
                {name: 'Lego City', length: 1500},
               ]
      },
      {
        name: "Yug yug",
        songs: [{name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500},
                {name: 'Lego City', length: 1500},
               ]
      },
      {
        name: "Jazz",
        songs: [{name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500},
                {name: 'Lego City', length: 1500},
               ]
      },
      {
        name: "Death Grips",
        songs: [{name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500}, 
                {name: 'Lego City', length: 1500},
                {name: 'Lego City', length: 1500},
               ]
      },
    ]
  }
};
let logo = require('../images/SpotLogo.png')


class PlaylistCounter extends Component {
  render() {
    return (
      <div style={{...defaultStyle, width: "40%", display: 'inline-block'}}>
        <h2>Playlists: {this.props.playlists && this.props.playlists.length}</h2>
      </div>
    );
  }
}

class TimeCount extends Component {
  render() {
    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalTime = allSongs.reduce((sum,eachSong) => {
      return sum + eachSong.length
    }, 0)
    return (
      <div style={{...defaultStyle, width: "40%", display: 'inline-block'}}>
        <h2>Length: {Math.round(totalTime/1000)} min</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render() {
    return (
      <div style={defaultStyle}>
        <img/>
        <input type="text"/>
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    return (
      <div style={{...defaultStyle, display: 'inline-block', width: "25%"}}>
        <img />
        <h3>{this.props.name}</h3>
        <ul><li>Song 1</li><li>Song 2</li><li>Song 3</li></ul>
      </div>
    );
  }
}

export default class ConnSpotify extends Component {
  constructor() {
    super();
    this.state = {
      serverData: {}
    };
  }

  componentDidMount() {
    setTimeout(() => {
    this.setState({serverData: fakeServerData});
  }, 1000);
  }
  render() {
    return (

      <div className="split"> 
        {/* <h1 style={{fontSize: '30px',color: 'white'}}>Spotify Info</h1> */}
            <div class = "split left">
              <img src={logo} />
              <div className="content">
                <form onSubmit={this.handleSubmit}>
                  <b>JukerBoxer</b>
                  <input value={this.username} onChange={e => this.setSpotUserName(e.target.value)} type='text' placeholder="Spotify UserName" />
                  <input value={this.username} onChange={e => this.setSpotPasswordName(e.target.value)} type='password' placeholder="Spotify Password" />
                </form>
              </div>


            <div class = "split right">
              <div className="spotData">
                {this.state.serverData.user ?
                <div>
                  <h1 style={{fontSize: '30px',color: 'white'}}>
                    {this.state.serverData.user.name}'s Playlist
                  </h1>
                  <PlaylistCounter playlists={this.state.serverData.user.playlists}/>
                  <TimeCount playlists={this.state.serverData.user.playlists}/>
                  <Filter/>
                  {
                    this.state.serverData.user.playlists.map(playlist => 
                      <Playlist name={playlist.name}/>  
                  )}
                  <Playlist/>
                  <Playlist/>
                  <Playlist/>
                  <Playlist/>
                </div> : <h1>'Loading...'</h1>
                }
              </div>
          </div>
        </div>
      </div>
    );
  }  
}
