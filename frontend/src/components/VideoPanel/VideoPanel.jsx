import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import io from 'socket.io-client';
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
  constructor() {
    super();
    this.state = {
      call: false,
      hangup: true
    };

    this.mediaState = {
      bridge: '',
      user: ''
    }
    this.onRemoteHangup = this.onRemoteHangup.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.sendData = this.sendData.bind(this);
    this.setupDataHandlers = this.setupDataHandlers.bind(this);
    this.setDescription = this.setDescription.bind(this);
    this.sendDescription = this.sendDescription.bind(this);
    this.hangup = this.hangup.bind(this);
    this.init = this.init.bind(this);
    this.setDescription = this.setDescription.bind(this);

    this.socket = io.connect("localhost:8080");
  }

  componentDidMount() {
    // Video element where stream will be placed.
    this.localVideo = document.getElementById('local');
    this.remoteVideo = document.getElementById('remote');

    this.getUserMedia = navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    }).then(stream => this.localVideo.srcObject = this.localStream = stream)
      .catch(e => alert('getUserMedia() error: ' + e.name));

    // this.socket.on('message', this.onMessage);
    // this.socket.on('hangup', this.onRemoteHangup);
  }

  // componentWillMount() {
  //   window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  // }

  // componentWillUnmount() {
  //   // Implement the code here to release resources used by the camera
  //   if (this.localStream !== undefined) {
  //     this.localStream.getVideoTracks()[0].stop();
  //   }
  //   this.socket.emit('leave');
  // }

  onRemoteHangup() {
    this.mediaState = { user: 'host', bridge: 'host-hangup' };
  }
  onMessage(message) {
    if (message.type === 'offer') {
      // set remote description and answer
      this.pc.setRemoteDescription(new RTCSessionDescription(message));
      this.pc.createAnswer()
        .then(this.setDescription)
        .then(this.sendDescription)
        .catch(this.handleError); // An error occurred, so handle the failure to connect

    } else if (message.type === 'answer') {
      // set remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate') {
      // add ice candidate
      this.pc.addIceCandidate(
        new RTCIceCandidate({
          sdpMLineIndex: message.mlineindex,
          candidate: message.candidate
        })
      );
    }
  }
  sendData(msg) {
    this.dc.send(JSON.stringify(msg))
  }
  // Set up the data channel message handler
  setupDataHandlers() {
    this.dc.onmessage = e => {
      var msg = JSON.parse(e.data);
      console.log('received message over data channel:' + msg);
    };
    this.dc.onclose = () => {
      this.remoteStream.getVideoTracks()[0].stop();
      console.log('The Data Channel is Closed');
    };
  }
  setDescription(offer) {
    this.pc.setLocalDescription(offer);
  }
  // send the offer to a server to be forwarded to the other peer
  sendDescription() {
    this.socket.send(this.pc.localDescription);
  }
  hangup() {
    this.mediaState = { user: 'guest', bridge: 'guest-hangup' };
    this.pc.close();
    this.socket.emit('leave');
  }
  handleError(e) {
    console.log(e);
  }
  init() {
    // wait for local media to be ready
    const attachMediaIfReady = () => {
      this.dc = this.pc.createDataChannel('chat');
      this.setupDataHandlers();
      console.log('attachMediaIfReady')
      this.pc.createOffer()
        .then(this.setDescription)
        .then(this.sendDescription)
        .catch(this.handleError); // An error occurred, so handle the failure to connect
    }
    // set up the peer connection
    // this is one of Google's public STUN servers
    // make sure your offer/answer role does not change. If user A does a SLD
    // with type=offer initially, it must do that during  the whole session
    this.pc = new RTCPeerConnection({ iceServers: [{ url: 'stun:stun.l.google.com:19302' }] });
    // when our browser gets a candidate, send it to the peer
    this.pc.onicecandidate = e => {
      console.log(e, 'onicecandidate');
      if (e.candidate) {
        this.socket.send({
          type: 'candidate',
          mlineindex: e.candidate.sdpMLineIndex,
          candidate: e.candidate.candidate
        });
      }
    };
    // when the other side added a media stream, show it on screen
    this.pc.onaddstream = e => {
      console.log('onaddstream', e)
      this.remoteStream = e.stream;
      this.remoteVideo.srcObject = this.remoteStream = e.stream;
      this.mediaState = { ...this.mediaState, bridge: 'established' };
    };
    this.pc.ondatachannel = e => {
      // data channel
      this.dc = e.channel;
      this.setupDataHandlers();
      this.sendData({
        peerMediaStream: {
          video: this.localStream.getVideoTracks()[0].enabled
        }
      });
      //sendData('hello');
    };
    // attach local media to the peer connection
    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    // call if we were the last to connect (to increase
    // chances that everything is set up properly at both ends)
    if (this.mediaState.user === 'host') {
      this.getUserMedia.then(attachMediaIfReady);
    }
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
              <Button disabled={this.state.call} onClick={() => {
                this.setState({ call: true });
                this.setState({ hangup: false });
                this.socket.emit('message', "Hello World");
              }}>Call</Button>
              <Button disabled={this.state.hangup} onClick={() => {
                this.setState({ call: false });
                this.setState({ hangup: true });
              }}>Hang Up</Button>
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <video id="local" autoPlay playsInline style={{ width: "100%", height: "100%" }}></video>
          </div>
          <div style={{ width: "100%" }}>
            <video id="remote" autoPlay playsInline style={{ width: "100%", height: "100%" }}></video>
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

