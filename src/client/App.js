import React from 'react';
import {
  BrowserRouter, Switch, Route, Redirect
} from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Protected from './components/Protected';
import SpotifyTest from './components/SpotifyTest';
import { getSession } from './Auth';
import './app.css';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      getSession() !== undefined ? <Component {...props} /> : <Redirect to="/login" />
    )}
  />
);

export default () => (
  <BrowserRouter>
    <Switch>
      <Route path="/" component={Home} exact />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <PrivateRoute path="/spotify-test" component={SpotifyTest} />
      <PrivateRoute path="/protected" component={Protected} />
      <Route component={Home} />
    </Switch>
  </BrowserRouter>
);
