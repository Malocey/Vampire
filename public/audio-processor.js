class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = (event) => {
            if (event.data.type === 'start', event.data.micOpen) {
                this.micOpen = event.data.micOpen;
            }
        };
        this.micOpen = false;
    }

    process(inputs, outputs, parameters) {
        if (!this.micOpen) {
            return true;
        }
        const input = inputs[0];
        if (input && input.length > 0 && input[0] && input[0].length > 0) {
            const pcmData = input[0];
            this.port.postMessage({ type: 'audioData', data: pcmData.buffer });
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);