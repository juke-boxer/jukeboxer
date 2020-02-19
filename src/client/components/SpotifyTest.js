import React from 'react';
import { useHistory } from 'react-router-dom';
import { getSession, logOut } from '../Auth';
import './Login.css';

export default () => {
  document.title = 'Protected';

  const history = useHistory();

  const logout = () => {
    //history.push('/api/spotify/login');
    window.location.href = '../api/spotify/login';
  };

  return (
    <div className="container">
      <div className="content">
        <b>{`SPOTIFY TIME, ${getSession().username}`}</b>
        <button type="button" onClick={logout}>Start</button>
      </div>
    </div>
  );
};
