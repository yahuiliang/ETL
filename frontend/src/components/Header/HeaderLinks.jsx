import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import withStyles from "@material-ui/core/styles/withStyles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Tooltip from "@material-ui/core/Tooltip";
import { Create, Business, LockOpen, FindInPage, Videocam } from "@material-ui/icons";

import Button from "components/CustomButtons/Button.jsx";
import headerLinksStyle from "assets/jss/material-kit-react/components/headerLinksStyle.jsx";


class HeaderLinks extends Component {
  render() {
    const { classes } = this.props;
    return (
      <List className={classes.list}>

        <ListItem className={classes.listItem}>
          <Button
            color="transparent"
            target="_blank"
            className={classes.navLink}
          >
            <Link className={classes.link} to="/about">
              <Business className={classes.icons} /> About
            </Link>
          </Button>
        </ListItem>

        <ListItem className={classes.listItem}>
          <Button
            color="transparent"
            target="_blank"
            className={classes.navLink}
          >
            {this.props.isAuthenticated ?
              <Link className={classes.link} to="/profile/usr">
                <FindInPage className={classes.icons} /> Match
              </Link>
              :
              <Link className={classes.link} to="/signup">
                <Create className={classes.icons} /> Register
              </Link>
            }
          </Button>
        </ListItem>


        <ListItem className={classes.listItem}>
          {this.props.isAuthenticated
            ? <Fragment>
              <Button
                color="transparent"
                target="_blank"
                className={classes.navLink}
                onClick={this.props.handleLogout}
              >
                <Link className={classes.link} to="/login-page">
                  <LockOpen className={classes.icons} /> Logout
                </Link>
              </Button>
            </Fragment>
            : <Fragment>
              <Button
                color="transparent"
                target="_blank"
                className={classes.navLink}
              >
                <Link className={classes.link} to="/login-page">
                  <LockOpen className={classes.icons} /> Login
                </Link>
              </Button>
            </Fragment>
          }

        </ListItem>

        {this.props.isAuthenticated ?
          <ListItem className={classes.listItem}>
            <Button
              color="transparent"
              target="_blank"
              className={classes.navLink}
            >
              <Link className={classes.link} to="/video">
                <Videocam className={classes.icons} /> Video
          </Link>
            </Button>
          </ListItem>
          :
          null
        }

        <ListItem className={classes.listItem}>
          <Tooltip
            title="Follow me on Github"
            placement={window.innerWidth > 959 ? "top" : "left"}
            classes={{ tooltip: classes.tooltip }}
          >
            <Button
              href="https://github.com/superyang713"
              target="_blank"
              color="transparent"
              className={classes.navLink}
            >
              <i className={classes.socialIcons + " fab fa-github"} />
            </Button>
          </Tooltip>
        </ListItem>

      </List>
    );
  }
}

export default withStyles(headerLinksStyle)(HeaderLinks);
