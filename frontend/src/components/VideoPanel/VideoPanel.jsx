import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Camera from "models/Camera.jsx";
import Button from '@material-ui/core/Button';

const styles = theme => ({
  card: {
    display: 'flex',
    height: "100%"
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: '1 0 auto',
  },
  cover: {
    width: "100%",
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  playIcon: {
    height: 38,
    width: 38,
  },
});

class VideoPanel extends Component {
  componentDidMount() {
    // Video element where stream will be placed.
    const localVideo = document.querySelector('video');
    this.camera = new Camera(localVideo);
    this.camera.startStreaming();
  }

  componentWillUnmount() {
    // Implement the code here to release resources used by the camera
    this.camera.stopStreaming();
  }

  render() {
    const { classes } = this.props;
    return (
      <div style={{ height: 400 }}>
        <Card className={classes.card}>
          <div className={classes.details}>
            <CardContent className={classes.content}>
              <Typography component="h5" variant="h5">
                Test Video
          </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Yahui Liang
          </Typography>
            </CardContent>
            <div className={classes.controls}>
              <Button>Stop</Button>
              <Button>Start</Button>
              <Button>Call</Button>
              <Button>Hang Up</Button>
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <video autoPlay playsInline style={{ width: "100%", height: "100%" }}></video>
          </div>
        </Card>
      </div>
    );
  }
}

VideoPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(VideoPanel);

