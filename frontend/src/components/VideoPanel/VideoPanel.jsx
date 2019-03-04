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

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

var constraints = {
  video: true
};

class VideoPanel extends Component {
  constructor() {
    super();

    this.state = {
      call: false,
      hangup: true
    };

    this.isChannelReady = false;
    this.isInitiator = false;
    this.isStarted = false;
    this.localStream = undefined;
    this.pc = undefined;
    this.remoteStream = undefined;
    this.turnReady = undefined;

    this.room = 'foo';

    this.sendMessage = this.sendMessage.bind(this);
    this.maybeStart = this.maybeStart.bind(this);
    this.handleIceCandidate = this.handleIceCandidate.bind(this);
    this.setLocalAndSendMessage = this.setLocalAndSendMessage.bind(this);
    this.hangup = this.hangup.bind(this);
    this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this);
  }

  componentDidMount() {
    this.localVideo = document.getElementById('local');
    this.remoteVideo = document.getElementById('remote');

    this.socket = io.connect("localhost:8080");

    if (this.room !== '') {
      this.socket.emit('create or join', this.room);
      console.log('Attempted to create or  join room', this.room);
    }

    this.socket.on('created', (room) => {
      console.log('Created room ' + room);
      this.isInitiator = true;
    });

    this.socket.on('full', (room) => {
      console.log('Room ' + room + ' is full');
    });

    this.socket.on('join', (room) => {
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      this.isChannelReady = true;
    });

    this.socket.on('joined', (room) => {
      console.log('joined: ' + room);
      this.isChannelReady = true;
    });

    this.socket.on('log', (array) => {
      console.log.apply(console, array);
    });

    // This client receives a message
    this.socket.on('message', (message) => {
      console.log('Client received message:', message);
      if (message === 'got user media') {
        this.maybeStart();
      } else if (message.type === 'offer') {
        if (!this.isInitiator && !this.isStarted) {
          this.maybeStart();
        }
        this.pc.setRemoteDescription(new RTCSessionDescription(message));
        this.doAnswer();
      } else if (message.type === 'answer' && this.isStarted) {
        this.pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && this.isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        this.pc.addIceCandidate(candidate);
      } else if (message === 'bye' && this.isStarted) {
        this.handleRemoteHangup();
      }
    });

    // Get the video stream
    navigator.mediaDevices.getUserMedia({
      video: true
    })
      .then((stream) => {
        console.log('Adding local stream.');
        this.localStream = stream;
        this.localVideo.srcObject = this.localStream;
        this.sendMessage('got user media');
        if (this.isInitiator) {
          this.maybeStart();
        }
      })
      .catch((e) => {
        alert('getUserMedia() error: ' + e.name);
      });

    console.log('Getting user media with constraints', constraints);

    if (window.location.hostname !== 'localhost') {
      this.requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      );
    }
  }

  componentWillUnmount() {
    this.sendMessage('bye');
  }

  sendMessage(message) {
    console.log('Client sending message: ', message);
    this.socket.emit('message', message);
  }

  maybeStart() {
    console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
    if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
      console.log('>>>>>> creating peer connection');
      this.createPeerConnection();
      this.pc.addStream(this.localStream);
      this.isStarted = true;
      console.log('isInitiator', this.isInitiator);
      if (this.isInitiator) {
        // doCall
        console.log('Sending offer to peer');
        this.pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
      }
    }
  }

  setLocalAndSendMessage(sessionDescription) {
    this.pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    this.sendMessage(sessionDescription);
  }

  handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }

  createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(null);
      this.pc.onicecandidate = this.handleIceCandidate;
      this.pc.onaddstream = this.handleRemoteStreamAdded;
      this.pc.onremovestream = this.handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      this.sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }

  handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    this.remoteStream = event.stream;
    console.log(this.remoteVideo);
    this.remoteVideo.srcObject = this.remoteStream;
  }

  handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  handleRemoteHangup() {
    console.log('Session terminated.');
    this.stop();
    this.isInitiator = false;
  }

  onCreateSessionDescriptionError(error) {
    console.trace('Failed to create session description: ' + error.toString());
  }

  doAnswer() {
    console.log('Sending answer to peer.');
    this.pc.createAnswer().then(
      this.setLocalAndSendMessage,
      this.onCreateSessionDescriptionError
    );
  }

  requestTurn(turnURL) {
    let turnExists = false;
    for (let i in pcConfig.iceServers) {
      if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
        this.turnExists = true;
        this.turnReady = true;
        break;
      }
    }
    if (!turnExists) {
      console.log('Getting TURN server from ', turnURL);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          let turnServer = JSON.parse(xhr.responseText);
          console.log('Got TURN server: ', turnServer);
          pcConfig.iceServers.push({
            'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
            'credential': turnServer.password
          });
          this.turnReady = true;
        }
      };
      xhr.open('GET', turnURL, true);
      xhr.send();
    }
  }

  hangup() {
    console.log('Hanging up.');
    this.stop();
    this.sendMessage('bye');
  }

  stop() {
    this.isStarted = false;
    this.pc.close();
    this.pc = null;
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
                // this.setState({ call: true });
                // this.setState({ hangup: false });
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

