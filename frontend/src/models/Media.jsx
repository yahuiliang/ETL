import io from 'socket.io-client';

// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
  video: true
};

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1,
};

const servers = null;

class Media {
  constructor(localVideo, remoteVideo) {
    this.localVideo = localVideo;
    this.remoteVideo = remoteVideo;

    this.localPeerConnection = null;
    this.remotePeerConnection = null;

    this.setDescriptionSuccess = this.setDescriptionSuccess.bind(this);
    this.trace = this.trace.bind(this);
    this.createdOffer = this.createdOffer.bind(this);
    this.getOtherPeer = this.getOtherPeer.bind(this);
    this.getPeerName = this.getPeerName.bind(this);
    this.gotLocalMediaStream = this.gotLocalMediaStream.bind(this);
    this.gotRemoteMediaStream = this.gotRemoteMediaStream.bind(this);
    this.handleConnectionChange = this.handleConnectionChange.bind(this);
    this.handleLocalMediaStreamError = this.handleLocalMediaStreamError.bind(this);
    this.createdAnswer = this.createdAnswer.bind(this);
    this.setLocalDescriptionSuccess = this.setLocalDescriptionSuccess.bind(this);
    this.setRemoteDescriptionSuccess = this.setRemoteDescriptionSuccess.bind(this);
    this.setSessionDescriptionError = this.setSessionDescriptionError.bind(this);
    this.setupPeerConnections = this.setupPeerConnections.bind(this);
  }

  // Logs success when setting session description.
  setDescriptionSuccess(peerConnection, functionName) {
    const peerName = this.getPeerName(peerConnection);
    this.trace(`${peerName} ${functionName} complete.`);
  }

  // Logs success when localDescription is set.
  setLocalDescriptionSuccess(peerConnection) {
    this.setDescriptionSuccess(peerConnection, 'setLocalDescription');
  }

  // Logs success when remoteDescription is set.
  setRemoteDescriptionSuccess(peerConnection) {
    this.setDescriptionSuccess(peerConnection, 'setRemoteDescription');
  }

  // Logs error when setting session description fails.
  setSessionDescriptionError(error) {
    this.trace(`Failed to create session description: ${error.toString()}.`);
  }

  // Define helper functions
  // Gets the "other" peer connection.
  getOtherPeer(peerConnection) {
    return (peerConnection === this.localPeerConnection) ?
      this.remotePeerConnection : this.localPeerConnection;
  }

  // Gets the name of a certain peer connection.
  getPeerName(peerConnection) {
    return (peerConnection === this.localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
  }


  // Logs changes to the connection state.
  handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log('ICE state change event: ', event);
    this.trace(`${this.getPeerName(peerConnection)} ICE state: ` +
      `${peerConnection.iceConnectionState}.`);
  }

  // Logs an action (text) and the time when it happened on the console.
  trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
    console.log(now, text);
  }

  // Logs offer creation and sets peer connection session descriptions.
  createdOffer(description) {
    this.trace(`Offer from localPeerConnection:\n${description.sdp}`);

    this.trace('localPeerConnection setLocalDescription start.');
    this.localPeerConnection.setLocalDescription(description)
      .then(() => {
        this.setLocalDescriptionSuccess(this.localPeerConnection);
      }).catch((error) => {
        this.trace(`Failed to create session description: ${error.toString()}.`);
      });

    this.trace('remotePeerConnection setRemoteDescription start.');
    this.remotePeerConnection.setRemoteDescription(description)
      .then(() => {
        this.setRemoteDescriptionSuccess(this.remotePeerConnection);
      }).catch((error) => {
        this.trace(`Failed to create session description: ${error.toString()}.`);
      });

    this.trace('remotePeerConnection createAnswer start.');
    this.remotePeerConnection.createAnswer()
      .then(this.createdAnswer)
      .catch((error) => {
        this.trace(`Failed to create session description: ${error.toString()}.`);
      });
  }

  // Logs answer to offer creation and sets peer connection session descriptions.
  createdAnswer(description) {
    this.trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

    this.trace('remotePeerConnection setLocalDescription start.');
    this.remotePeerConnection.setLocalDescription(description)
      .then(() => {
        this.setLocalDescriptionSuccess(this.remotePeerConnection);
      }).catch(this.setSessionDescriptionError);

    this.trace('localPeerConnection setRemoteDescription start.');
    this.localPeerConnection.setRemoteDescription(description)
      .then(() => {
        this.setRemoteDescriptionSuccess(this.localPeerConnection);
      }).catch(this.setSessionDescriptionError);
  }

  setupPeerConnections() {
    // Create peer connections and add behavior.

    ////////////////////////////////////////////////////////
    // The user 1 setup
    this.localPeerConnection = new RTCPeerConnection(servers);
    this.trace('Created local peer connection object localPeerConnection.');

    this.localPeerConnection.addEventListener('icecandidate', (event) => {
      const peerConnection = event.target;
      const iceCandidate = event.candidate;

      if (iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        const otherPeer = this.getOtherPeer(peerConnection);

        otherPeer.addIceCandidate(newIceCandidate)
          .then(() => {
            this.trace(`${this.getPeerName(peerConnection)} addIceCandidate success.`);
          }).catch((error) => {
            this.trace(`${this.getPeerName(peerConnection)} failed to add ICE Candidate:\n` +
              `${error.toString()}.`);
          });
        this.trace(`${this.getPeerName(peerConnection)} ICE candidate:\n${event.candidate.candidate}.`);
      }
    });
    this.localPeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);

    // The user 2 setup
    this.remotePeerConnection = new RTCPeerConnection(servers);
    this.trace('Created remote peer connection object remotePeerConnection.');

    this.remotePeerConnection.addEventListener('icecandidate', this.handleConnection);
    this.remotePeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);
    this.remotePeerConnection.addEventListener('addstream', this.gotRemoteMediaStream);
    ///////////////////////////////////////////////////////

    // Add local stream to connection and create offer to connect.
    this.localPeerConnection.addStream(this.localStream);
    this.trace('Added local stream to localPeerConnection.');

    this.trace('localPeerConnection createOffer start.');
    this.localPeerConnection.createOffer(offerOptions)
      .then(this.createdOffer).catch((error) => {
        this.trace(`Failed to create session description: ${error.toString()}.`);
      });
  }

  hangupAction() {
    if (this.localPeerConnection != null && this.remotePeerConnection != null) {
      this.localPeerConnection.close();
      this.remotePeerConnection.close();
      this.localPeerConnection = null;
      this.remotePeerConnection = null;
      this.trace('Ending call.');
    }
  }

  /////////////////////////////////////////////////////////////////////////
  // Handles success by adding the MediaStream to the video element.
  gotLocalMediaStream(mediaStream) {
    this.localStream = mediaStream;
    this.localVideo.srcObject = mediaStream;
    // can also use getAudioTracks() or getVideoTracks()
    this.videoTrack = mediaStream.getVideoTracks()[0];  // if only one media track
  }

  // Handles remote MediaStream success by adding it as the remoteVideo src.
  gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    this.remoteVideo.srcObject = mediaStream;
    this.remoteStream = mediaStream;
    this.trace('Remote peer connection received remote stream.');
  }

  // Handles error by logging a message to the console with the error message.
  handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
  }

  startStreaming() {
    // Initializes media stream.
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then((mediaStream) => {
        this.gotLocalMediaStream(mediaStream);
      }).catch((error) => {
        this.handleLocalMediaStreamError(error);
      });
  }

  stopStreaming() {
    this.videoTrack.stop();
  }
}

export default Media;
