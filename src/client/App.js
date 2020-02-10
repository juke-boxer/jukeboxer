import React from 'react';
import {
  BrowserRouter, Switch, Route
} from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import ConnSpotify from './components/ConnSpotify';
import Register from './components/Register';
import './app.css';

export default () => (
  <BrowserRouter>
    <Switch>
      <Route path="/" component={Home} exact />
      <Route path="/login" component={Login} />
      <Route path="/connSpotify" component={ConnSpotify} />
      <Route path="/register" component={Register} />
      <Route component={Error} />
    </Switch>
  </BrowserRouter>
);
