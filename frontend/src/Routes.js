import React from "react";
import { Switch, Route } from "react-router-dom";

import AppliedRoute from "components/AppliedRoute/AppliedRoute";
import UnauthenticatedRoute from "components/UnauthenticatedRoute/UnauthenticatedRoute";
import AuthenticatedRoute from "components/AuthenticatedRoute/AuthenticatedRoute";

import LandingPage from "views/LandingPage/LandingPage.jsx";
import AboutUs from "views/AboutUs/AboutUs.jsx";
import Signup from "views/Signup/Signup.jsx";
import ProfilePage from "views/ProfilePage/ProfilePage.jsx";
import VideoPage from "views/VideoPage/VideoPage.jsx";
import LoginPage from "views/LoginPage/LoginPage.jsx";
import NotFound from "views/NotFound/NotFound";


export default ({childProps}) =>
  <Switch>
    <AppliedRoute path="/" exact component={LandingPage} props={childProps} />
    <AppliedRoute path="/about" exact component={AboutUs} props={childProps} />
    <UnauthenticatedRoute path="/login-page" exact component={LoginPage} props={childProps} />
    <UnauthenticatedRoute path="/signup" exact component={Signup} props={childProps} />
    <AuthenticatedRoute path="/profile/:id" exact component={ProfilePage} props={childProps} />
    <AuthenticatedRoute path="/video" exact component={VideoPage} props={childProps} />
    <Route component={NotFound} />
  </Switch>;
