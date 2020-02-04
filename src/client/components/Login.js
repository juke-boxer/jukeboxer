import React, { Component, useState } from 'react';
import './Login.css';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: ''
    }
  }

  validateForm = () => {
    const { email, password } = this.state;
    return email.length > 0 && password.length > 0;
  }

  setEmail = (newVal) => {
    this.setState({ email: newVal });
  }

  setPassword = (newVal) => {
    this.setState({ password: newVal });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    console.log(this.state);

    fetch('api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state),
    })
      .then(res => res.text())
      .then(data => alert(data));
  }

  render() {
    return (
      <div className="container">
        <div className="content">
          <form onSubmit={this.handleSubmit}>
            <b>Jukeboxer</b>
            <input value={this.email} onChange={e => this.setEmail(e.target.value)} type="email" placeholder="Username" />
            <input value={this.password} onChange={e => this.setPassword(e.target.value)} type="password" placeholder="Password" />
            <button type="submit" disabled={!this.validateForm()}>Login</button>
          </form>
        </div>
      </div>
    );
  }
}
