// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
  video: true,
};

class Camera {
  constructor(localVideo) {
    this.localVideo = localVideo;
  }

  // Handles success by adding the MediaStream to the video element.
  gotLocalMediaStream(mediaStream) {
    this.localStream = mediaStream;
    this.localVideo.srcObject = mediaStream;
    // can also use getAudioTracks() or getVideoTracks()
    this.track = mediaStream.getTracks()[0];  // if only one media track
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
    this.track.stop();
  }
}

export default Camera;
