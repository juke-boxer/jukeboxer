import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getSession } from '../Auth';
import fetch from 'node-fetch';

export default () => {
  document.title = 'Playlists';

  const history = useHistory();
  const [playlists, setPlaylists] = useState([]);

  const getPlaylists = () => {
    fetch(`../api/spotify/getPlaylists?user_id=${getSession().userid}`)
      .then(response => response.json())
      .then((response) => {
        console.log(response);
        //playlists = response.items;
        setPlaylists(response.items);
      });
  };

  useEffect(getPlaylists, []);

  return (
    <div style={{  }} className="container">
      <div style={{ width: '90%', maxWidth: 'none', top: 'auto', left: 'auto', transform: 'none' }} className="content">
        <b>Playlists:</b>
        <div style={{ margin: '10px', height: '500px', overflowY: 'scroll' }}>
          {
            playlists.map((playlist, i) => {
              return <PlaylistButton key={i.toString()} imageLink={playlist.images[0].url} redirectLink={playlist.external_urls.spotify} />;
            })
          }
        </div>
        <button style={{ width: '250px' }} type="button" onClick={() => history.push('./protected')}>Back</button>
      </div>
    </div>
  );
};

const PlaylistButton = (props) => {
  return (
    <a href={props.redirectLink} target="_blank">
      <img style={{ boxShadow: '5px 10px 8px black', margin: '10px', width: '150px', height: '150px' }} alt="Playlist" src={props.imageLink} />
    </a>
  );
};
