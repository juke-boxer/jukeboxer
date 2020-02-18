/* eslint-disable no-alert */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { setSession, getSession } from '../Auth';
import logo from '../images/logo.png';
import './Login.css';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    };

    document.title = 'Login';

    const session = getSession();
    if (session !== undefined) {
      this.props.history.push('/protected', { username: session.username });
    }
  }

  validateForm = () => {
    const { username, password } = this.state;
    return username.length > 0 && password.length > 0;
  }

  setUsername = (newVal) => {
    this.setState({ username: newVal });
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
      .then(res => res.json())
      .then((data) => {
        if (data.result === 'success') {
          setSession(data.token);
          this.props.history.push('/protected');
        } else {
          alert('Incorrect Login');
        }
      });
  }

  render() {
    return (
      <div className="container">
        <div className="content">
          <form onSubmit={this.handleSubmit}>
            <img className="logo" alt="logo" src={logo} />
            <input value={this.username} onChange={e => this.setUsername(e.target.value)} type="text" placeholder="Username" />
            <input value={this.password} onChange={e => this.setPassword(e.target.value)} type="password" placeholder="Password" />
            <button type="submit" disabled={!this.validateForm()}>Login</button>
            <Link to="/register">Click here to create an account</Link>
          </form>
        </div>
      </div>
    );
  }
}
