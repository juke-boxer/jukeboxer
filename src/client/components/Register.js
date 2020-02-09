import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

export default () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = username.length > 0 && password.length > 0 && confirmPassword.length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    fetch('api/users/createUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    })
      .then(res => res.text())
      .then(data => alert(data.message));
  };

  return (
    <div className="container">
      <div className="content">
        <form onSubmit={handleSubmit}>
          <b>Register</b>
          <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="Username" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
          <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm Password" />
          <button type="submit" disabled={!validateForm}>Register</button>
          <p>Already have an account?</p>
          <Link to="/login">Click here to login</Link>
        </form>
      </div>
    </div>
  );
};
