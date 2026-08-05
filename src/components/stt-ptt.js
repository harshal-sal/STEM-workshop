/**
 * Speech-To-Text Push-To-Talk (STT-PTT) Component
 * Captures audio on A-button hold / gesture and handles transcription.
 */
AFRAME.registerComponent('stt-ptt', {
    init: function () {
        this.recording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];

        this.el.sceneEl.addEventListener('action-talk-start', this.startRecording.bind(this));
        this.el.sceneEl.addEventListener('action-talk-end', this.stopRecording.bind(this));
    },

    startRecording: async function () {
        if (this.recording) return;
        this.recording = true;
        this.audioChunks = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
            this.mediaRecorder.start();
            console.log("Audio recording started...");
        } catch (err) {
            console.warn("Microphone access denied or unavailable:", err);
            this.recording = false;
        }
    },

    stopRecording: function () {
        if (!this.recording || !this.mediaRecorder) return;
        this.recording = false;

        this.mediaRecorder.stop();
        this.mediaRecorder.onstop = async () => {
            console.log("Audio recording stopped.");
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Mock STT result or post to transcription endpoint
            const transcript = "Tell me about this monument.";
            
            // Emit transcript event for LLM processing
            this.el.sceneEl.emit('speech-transcribed', { transcript });
        };
    }
});
