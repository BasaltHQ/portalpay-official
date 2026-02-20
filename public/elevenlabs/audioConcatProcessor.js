/*
 * ulaw decoding logic taken from the wavefile library
 * https://github.com/rochars/wavefile/blob/master/lib/codecs/mulaw.js
 * USED BY @elevenlabs/client
 */

const decodeTable = [0, 132, 396, 924, 1980, 4092, 8316, 16764];

function decodeSample(muLawSample) {
  let sign;
  let exponent;
  let mantissa;
  let sample;
  muLawSample = ~muLawSample;
  sign = (muLawSample & 0x80);
  exponent = (muLawSample >> 4) & 0x07;
  mantissa = muLawSample & 0x0F;
  sample = decodeTable[exponent] + (mantissa << (exponent + 3));
  if (sign !== 0) sample = -sample;

  return sample;
}

class AudioConcatProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = []; // Initialize an empty buffer
    this.cursor = 0;
    this.currentBuffer = null;
    this.wasInterrupted = false;
    this.finished = false;

    // Resampling state
    this.fraction = 0; // Sub-sample offset/fraction (0..1)
    // Assume input is 16kHz unless told otherwise
    this.sourceSampleRate = 16000;

    this.port.onmessage = ({ data }) => {
      switch (data.type) {
        case "setFormat":
          this.format = data.format;
          if (data.sampleRate) {
            this.sourceSampleRate = data.sampleRate;
          }
          break;
        case "buffer":
          this.wasInterrupted = false;
          this.buffers.push(
            this.format === "ulaw"
              ? new Uint8Array(data.buffer)
              : new Int16Array(data.buffer)
          );
          break;
        case "interrupt":
          this.wasInterrupted = true;
          break;
        case "clearInterrupted":
          if (this.wasInterrupted) {
            this.wasInterrupted = false;
            this.buffers = [];
            this.currentBuffer = null;
            this.cursor = 0;
            this.fraction = 0;
          }
      }
    };
  }

  getSample(buffer, index) {
    // Boundary check
    if (index >= buffer.length) return 0;

    let value = buffer[index];
    if (this.format === "ulaw") {
      value = decodeSample(value);
    }
    return value / 32768.0;
  }

  process(_, outputs) {
    const output = outputs[0][0];
    // Global sampleRate is the AudioContext rate (e.g. 44100 or 48000)
    // We want to advance input cursor by source/context ratio per output sample
    // Example: 16000 / 48000 = 0.333 input samples per output sample (upsampling)
    const ratio = this.sourceSampleRate / sampleRate;

    for (let i = 0; i < output.length; i++) {
      // Ensure we hava a buffer
      if (!this.currentBuffer) {
        if (this.buffers.length === 0) {
          // No more data
          output[i] = 0;
          this.finished = true; // Mark potentially finished, but continue filling zeros
          continue;
        }
        this.currentBuffer = this.buffers.shift();
        this.cursor = 0;
        this.finished = false;
      }

      // Linear Interpolation
      // sample = current * (1-frac) + next * frac
      const current = this.getSample(this.currentBuffer, this.cursor);

      // Look ahead for next sample
      let next = 0;
      if (this.cursor + 1 < this.currentBuffer.length) {
        next = this.getSample(this.currentBuffer, this.cursor + 1);
      } else {
        // End of this buffer, try to peek next buffer
        if (this.buffers.length > 0) {
          next = this.getSample(this.buffers[0], 0);
        } else {
          next = current; // Hold last sample if no future data
        }
      }

      output[i] = current * (1 - this.fraction) + next * this.fraction;

      // Advance input position
      this.fraction += ratio;
      while (this.fraction >= 1) {
        this.fraction -= 1;
        this.cursor++;

        // Check buffer end
        if (this.cursor >= this.currentBuffer.length) {
          this.currentBuffer = null;
          // If we need more samples for THIS output sample (downsampling case), 
          // we loop to fetch next buffer. 
          // But since we likely upsample (16k->48k), ratio < 1, 
          // so we usually consume <1 input sample.
          // If downsampling (44k->16k), ratio > 1, we might skip input samples.

          // Fetch next buffer immediately if available to continue
          if (this.buffers.length > 0) {
            this.currentBuffer = this.buffers.shift();
            this.cursor = 0;
          } else {
            // Ran out of data exactly at boundary
            break;
          }
        }
      }
    }

    // Notify if running dry
    if (this.finished && this.buffers.length === 0 && !this.currentBuffer) {
      this.port.postMessage({ type: "process", finished: true });
    }

    return true; // Keep processor alive
  }
}

registerProcessor("audioConcatProcessor", AudioConcatProcessor);
