import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import io from 'socket.io-client';
import Button from '@material-ui/core/Button';
import VideoDisplayArea from './VideoDisplayArea/VideoDisplayArea.jsx';

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
  }
});

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

class VideoPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      startDisable: false,
      stopDisable: true
    };

    this.localStream = undefined;
    this.pc = undefined;
    this.remoteStream = undefined;
    this.turnReady = undefined;

    this.room = 'foo';

    this.sendMessage = this.sendMessage.bind(this);
    this.handleIceCandidate = this.handleIceCandidate.bind(this);
    this.setLocalAndSendMessage = this.setLocalAndSendMessage.bind(this);
    this.hangup = this.hangup.bind(this);
    this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this);
  }

  componentDidMount() {
    this.localVideo = document.getElementById('local');
    this.remoteVideo = document.getElementById('remote');

    // if (window.location.hostname !== 'localhost') {
    //   this.requestTurn(
    //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    //   );
    // }

    // Connect to the server in this case
    this.socket = io.connect("localhost:8080");

    // Setup up listeners for server responses

    // This indicates that the room has been created
    this.socket.on('created', (room) => {
      console.log('Created room ' + room);
    });

    // This indicates that the room is full
    this.socket.on('full', (room) => {
      console.log('Room ' + room + ' is full');
    });

    // This indicates that the another peer tries to join the room that you created
    this.socket.on('join', (room) => {
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
    });

    // This indicates that you have joined the room
    this.socket.on('joined', (room) => {
      console.log('joined: ' + room);
    });

    // Simply log the informaiton sent from the server
    this.socket.on('log', (array) => {
      console.log.apply(console, array);
    });

    // Hangup the call since the other peer made this request
    this.socket.on('hangup', () => {
      console.log("received hangup signal");
      this.hangup();
      this.setState({ stopDisable: true });
    });

    // This indicates that the client receives the message from the server
    this.socket.on('message', (message) => {
      if (this.props.role === "teacher") {
        // For teachers, they only send offers and accept anwsers from students
        if (message.type === 'answer') {
          // This is the message sent from the other peer
          // Set their meta data to the connection
          this.pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate') {
          // The protocal which allows me to connect to peers and exchange media data
          let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
          });
          this.pc.addIceCandidate(candidate);
          this.sendMessage('candidate added');
          this.setState({ stopDisable: false });
        }
      } else if (this.props.role === "student") {
        // For students, they only send anwsers for teacher's offers
        if (message.type === 'offer') {
          this.createPeerConnection();
          this.pc.setRemoteDescription(new RTCSessionDescription(message));
          this.accept();
        } else if (message === "candidate added") {
          this.setState({ stopDisable: false });
        }
      }
    });

    this.createOrJoinRoom();

    console.log('Getting user media with constraints');

    // Get the video stream
    navigator.mediaDevices.getUserMedia({
      video: true
    })
      .then((stream) => {
        console.log('Adding local stream.');

        this.localStream = stream;
        this.localVideo.srcObject = this.localStream;
      })
      .catch((e) => {
        alert('getUserMedia() error: ' + e.name);
      });
  }

  componentWillUnmount() {
    this.socket.emit('hangup');
    this.hangup();
    // Close the camera
    this.localStream.getVideoTracks()[0].stop();
    // Leave the room
    this.socket.emit('leave');
  }

  // The method can be called when users are matched and confirmed to be connected with each other
  createOrJoinRoom() {
    // Create or join the chatting room
    if (this.room !== '') {
      this.socket.emit('create or join', this.room);
      console.log('Attempted to create or join room', this.room);
    }
  }

  offer() {
    // Starts calling other peers
    this.createPeerConnection();
    this.pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
  }

  accept() {
    console.log('Sending answer to peer.');
    this.pc.createAnswer().then(
      this.setLocalAndSendMessage,
      this.onCreateSessionDescriptionError
    );
  }

  hangup() {
    console.log('Hanging up.');
    if (this.pc) {
      this.pc.removeTrack(this.videoTrack);
      // Stop the peer connection
      this.pc.close();
    }
    this.pc = null;
  }

  sendMessage(message) {
    console.log('Message from client: ', message);
    this.socket.emit('message', message);
  }

  createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(pcConfig);

      this.pc.onicecandidate = this.handleIceCandidate;
      this.pc.onaddstream = this.handleRemoteStreamAdded;

      // Attach local media to the peer connection
      this.videoTrack = this.pc.addTrack(this.localStream.getTracks()[0], this.localStream);
      // this.audioTrack = this.pc.addTrack(this.localStream.getTracks()[1], this.localStream);
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
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

  handleIceCandidate(event) {
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
    this.remoteVideo.srcObject = this.remoteStream;
  }

  onCreateSessionDescriptionError(error) {
    console.trace('Failed to create session description: ' + error.toString());
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

  buttonGroup() {
    if (this.props.role === "teacher") {
      return (
        <div>
          <Button
            disabled={this.state.startDisable}
            onClick={() => {
              this.offer();
              this.setState({ startDisable: true, stopDisable: false });
            }}>
            Start Teaching
          </Button>
          <Button
            disabled={this.state.stopDisable}
            onClick={() => {
              this.socket.emit('hangup');
              this.hangup();
              this.setState({ startDisable: false, stopDisable: true });
            }}>
            Stop Teaching
          </Button>
        </div>
      );
    } else {
      return (
        <div>
          <Button
            disabled={this.state.stopDisable}
            onClick={() => {
              this.socket.emit('hangup');
              this.hangup();
              this.setState({ stopDisable: true });
            }}>
            Stop Learning
          </Button>
        </div>

      );
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div style={{ height: 400 }}>
        <Card className={classes.card}>
          <div className={classes.details} style={{ width: 300 }}>
            <CardContent className={classes.content}>
              <Typography component="h5" variant="h5">
                {this.props.role + " video"}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {this.props.username}
              </Typography>
            </CardContent>
            <div className={classes.controls}>
              {this.buttonGroup()}
            </div>
          </div>
          <VideoDisplayArea />
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

