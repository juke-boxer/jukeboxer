import React, { useState } from 'react';
import './Login.css';

export default () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = username.length > 0 && password.length > 0 && confirmPassword.length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log(useState());

    fetch('api/users/createUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(useState()),
    })
      .then(res => res.text())
      .then(data => alert(data));
  };

  return (
    <div className="container">
      <div className="content">
        <form onSubmit={handleSubmit}>
          <b>Jukeboxer</b>
          <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="Username" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
          <input value={password} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm Password" />
          <button type="submit" disabled={!validateForm()}>Login</button>
        </form>
      </div>
    </div>
  );
};
