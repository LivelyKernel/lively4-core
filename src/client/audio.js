
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.lastAudioUrl = null;
    this.lastBlob = null;
  }

  async init() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.setupListeners();
  }

  setupListeners() {
    this.mediaRecorder.addEventListener("dataavailable", event => {
      this.audioChunks.push(event.data);
    })

    this.mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(this.audioChunks);
      this.lastBlob = audioBlob;
      if (this.lastAudioUrl) {
        // Revoke the old URL to avoid memory leaks
        URL.revokeObjectURL(this.lastAudioUrl);
      }
      this.lastAudioUrl = URL.createObjectURL(audioBlob);
      this.cleanup(); // Cleanup the audio chunks for the next recording

      this.stopRecordingResolve(this.lastBlob)
    })
  }

  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "inactive") {
      this.audioChunks = []; // Clear previous recordings
      this.mediaRecorder.start();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      return new Promise(resolve => {
        this.stopRecordingResolve = resolve
      })
    }
  }

  play() {
    if (this.lastAudioUrl) {
      const audio = new Audio(this.lastAudioUrl);
      audio.play();
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.audioChunks = [];
  }
}