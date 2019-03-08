import React, { Component } from "react";
import classNames from "classnames";
import withStyles from "@material-ui/core/styles/withStyles";
import { getCurrentUserInfo, getProfilePicFromS3 } from "../../libs/awsLib";

import Footer from "components/Footer/Footer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import Parallax from "components/Parallax/Parallax.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";

import profilePageStyle from "assets/jss/material-kit-react/views/profilePage.jsx";
import profilebg from "assets/img/profile-bg.jpg";
import VideoPanel from 'components/VideoPanel/VideoPanel.jsx';

class VideoPage extends Component {
  state = {
    isLoaded: false,
    user: {},
    userImage: "",
  }

  async componentDidMount() {
    try {
      const user = await getCurrentUserInfo();
      this.setState({ user });
      this.setState({ isLoaded: true });
      this.setState({ isLoaded: true });
      const userImage = await getProfilePicFromS3(this.state.user.profilePic);
      this.setState({ userImage });
    } catch (e) {
      alert(e);
    }
  }

  render() {
    const classes = this.props.classes;
    const imageClasses = classNames(
      classes.imgRaised,
      classes.imgRoundedCircle,
      classes.imgFluid
    );
    return (
      <div>
        <Parallax small filter image={profilebg} />
        <div className={classNames(classes.main, classes.mainRaised)}>
          <div>
            <div className={classes.container}>

              <GridContainer justify="center">
                <GridItem xs={12} sm={12} md={6}>
                  <div className={classes.profile}>
                    <div>
                      <img src={this.state.userImage} alt="..." className={imageClasses} />
                    </div>
                    <div className={classes.name}>
                      <h3 className={classes.title}>
                        {this.state.user.firstName} {this.state.user.lastName}
                      </h3>
                      <h6>{this.state.user.role}</h6>
                    </div>
                  </div>
                </GridItem>
              </GridContainer>
              <VideoPanel username={this.state.user.firstName} role={this.state.user.role} />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default withStyles(profilePageStyle)(VideoPage);
