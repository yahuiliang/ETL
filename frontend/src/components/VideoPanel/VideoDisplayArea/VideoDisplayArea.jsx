import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';

class VideoDisplayArea extends Component {
  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <Grid
          container
          direction="row"
          justify="flex-end"
          alignItems="flex-end"
          style={{ width: "100%", height: "100%" }}
        >
          <video id="remote" autoPlay playsInline style={{ width: "100%", height: "100%" }}></video>
          <video id="local" autoPlay playsInline style={{ width: "25%", height: "25%", position: "absolute" }}></video>
        </Grid>
      </div>
    );
  }
}

export default VideoDisplayArea;
