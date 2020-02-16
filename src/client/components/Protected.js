import React from 'react';
import { useHistory } from 'react-router-dom';
import { getSession, logOut } from '../Auth';
import logo from '../images/logo.png';
import './Login.css';

export default () => {
  document.title = 'Protected';

  const history = useHistory();

  const logout = () => {
    logOut();
    history.push('/');
  };

  return (
    <div className="container">
      <div className="content">
        <img className="logo" alt="logo" src={logo} />
        <b>{`Welcome Back, ${getSession().username}`}</b>
        <button type="button" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};
