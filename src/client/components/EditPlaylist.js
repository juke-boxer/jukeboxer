import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getSession } from '../Auth';
import fetch from 'node-fetch';
import './EditPlaylist.css';

export default (props) => {
  document.title = 'Edit Playlist';

  const history = useHistory();
  const [tracks, setTracks] = useState([]);
  const playlistID = props.location.state.playlistID;
  const [name, setName] = useState(props.location.state.playlistName);
  const [waiting, setWaiting] = useState(false);

  const getTracks = () => {
    fetch(`../api/spotify/getPlaylistTracks?user_id=${getSession().userid}&playlist_id=${playlistID}`)
      .then(response => response.json())
      .then((response) => {
        console.log(response);
        setTracks(response.items);
      });
  };

  const exportTracks = () => {
    const trackURIs = tracks.map((track) => {
      return `spotify:track:${track.track.id}`;
    });

    setWaiting(true);
    
    fetch(`../api/spotify/exportPlaylist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: getSession().userid,
        name,
        trackURIs
      })
    })
    .then((res) => res.json())
    .then(res => {
      setWaiting(false);
      alert(`Playlist ${name} Exported Successfully`);
    });
  };

  useEffect(getTracks, []);

  return (
    <div className="container">
      <div style={{ margin: '20px', padding: '0', width: '95%', maxWidth: 'none', top: 'auto', left: 'auto', transform: 'none'}} className="content">
        <b>Edit Playlist:</b><input id="playlistName" value={name} onChange={e => setName(e.target.value)} type="text" placeholder={props.location.state.playlistName}></input>
        <div style={{ height: '75vh', overflowY: 'auto' }}>
          <table style={{ display: tracks.length > 0 ? 'table' : 'none' }} className="trackList">
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Export</th>
              </tr>
            </thead>
            <tbody>
              {
                tracks.map((track, i) => {
                  return <PlaylistTrack key={i} index={i} allTracks={tracks} setTracks={setTracks} track={track} />;
                })
              }
            </tbody>
          </table>
        </div>
        <button disabled={waiting} style={{ width: '250px' }} type="button" onClick={() => exportTracks()}>Export</button>
        <br/>
        <button style={{ width: '250px' }} type="button" onClick={() => props.history.goBack()}>Back</button>
      </div>
    </div>
  );
};

const PlaylistTrack = (props) => {
  const [highlight, setHighlight] = useState(false);
  const [underline, setUnderline] = useState(false);

  const onMouseOver = (event) => {
    setHighlight(true);
  };

  const onMouseOut = (event) => {
    setHighlight(false);
  };

  const onDragStart = (event) => {
    event.dataTransfer.setData('text/plain', JSON.stringify(props));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setUnderline(true);
  };

  const onDragLeave = (event) => {
    setUnderline(false);
  };

  const deleteTrack = () => {
    const tempTracks = JSON.parse(JSON.stringify(props.allTracks));
    tempTracks.splice(props.index, 1);
    props.setTracks(tempTracks);
  };

  const onDrop = (event) => {
    let data = event.dataTransfer.getData('text/plain');
    let parsedData = JSON.parse(data);

    if (parsedData.index !== props.index)
    {
      const tempTracks = JSON.parse(JSON.stringify(props.allTracks));
      tempTracks.splice(parsedData.index, 1);

      if (parsedData.index <= props.index - 1)
        tempTracks.splice(props.index, 0, parsedData.track);
      else
        tempTracks.splice(props.index + 1, 0, parsedData.track);

      props.setTracks(tempTracks);
    }

    setUnderline(false);
  };

  return (
    <tr className='trackRow' style={{ borderBottom: underline ? '2px solid white' : '1px solid grey',
      backgroundColor: highlight ? 'rgba(100, 100, 100, 0.8)' : 'inherit'}} draggable="true" onMouseOver={onMouseOver} onMouseOut={onMouseOut} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <td><p>{props.track.track.name}</p></td>
      <td><p>{props.track.track.artists[0].name}</p></td>
      <td><p>{props.track.track.album.name}</p></td>
      <td className="delete" onClick={deleteTrack}>🗑️</td>
    </tr>
  );
};
