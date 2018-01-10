'use strict';
window.URL = window.URL || window.webkitURL;
/**
 * Detecte the correct AudioContext for the browser
 * */
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var recorder = new Recorder();
let startBtn = document.querySelector('.js-start');
let stopBtn = document.querySelector('.js-stop');
startBtn.onclick = recorder.startRecord;
stopBtn.onclick = recorder.stopRecord;

 	function Recorder() {
			let elementVolume = document.querySelector('.js-volume');
			let ctx = elementVolume.getContext('2d');
			let codeBtn = document.querySelector('.js-code');
			let pre = document.querySelector('pre');
			let downloadLink = document.getElementById('download');
			let audioElement = document.querySelector('audio');
			//let encoder = null;
			let microphone;
			let isRecording = false;
			var audioContext;
			let processor;
      let tracks;
      let worker;
			let config = {
				bufferLen: 4096,
				numChannels: 2,
				mimeType: 'audio/mpeg'
			};

  let saveRecording = blob => {
    var url = URL.createObjectURL(blob);
    audioElement.src = url;
  }

	this.startRecord = function() {
        console.log('BeginRecord');
        worker = new Worker('encoderWorker.js');
        worker.onmessage = function(event) { saveRecording(event.data.blob); };
				audioContext = new AudioContext();
        worker.postMessage({
          command: 'start',
          bitRate: 160,
          sampleRate: audioContext.sampleRate,
          numChannels: 2
        });

				/**
				* Create a ScriptProcessorNode with a bufferSize of
				* 4096 and two input and output channel
				* */
				if (audioContext.createJavaScriptNode) {
					processor = audioContext.createJavaScriptNode(config.bufferLen, config.numChannels, config.numChannels);
				} else if (audioContext.createScriptProcessor) {
					processor = audioContext.createScriptProcessor(config.bufferLen, config.numChannels, config.numChannels);
				} else {
					console.log('WebAudio API has no support on this browser.');
				}

				processor.connect(audioContext.destination);
				/**
				*  ask permission of the user for use microphone or camera
				* */
				navigator.mediaDevices.getUserMedia({ audio: true, video: false })
				.then(gotStreamMethod)
				.catch(err => {
          console.log('Err getUserMedia ', err);
      });
		};

		let getBuffers = (event) => {
				var buffers = [];
				for (var ch = 0; ch < 2; ++ch)
					buffers[ch] = event.inputBuffer.getChannelData(ch);
				return buffers;
			}

		let gotStreamMethod = (stream) => {
				startBtn.setAttribute('disabled', true);
				stopBtn.removeAttribute('disabled');
				audioElement.src = "";
				config = {
					bufferLen: 4096,
					numChannels: 2,
					mimeType: 'audio/mpeg'
				};
				isRecording = true;

				tracks = stream.getTracks();
				/**
				* Create a MediaStreamAudioSourceNode for the microphone
				* */
				microphone = audioContext.createMediaStreamSource(stream);
				/**
				* connect the AudioBufferSourceNode to the gainNode
				* */
				microphone.connect(processor);
				//encoder = new Mp3LameEncoder(audioContext.sampleRate, 160);
				/**
				* Give the node a function to process audio events
				*/
				processor.onaudioprocess = function(event) {
					//encoder.encode(getBuffers(event));
          worker.postMessage({ command: 'record', buffers: getBuffers(event) });
				};
			}

			this.stopRecord = function() {
				//stopBtnRecord();
        worker.postMessage({ command:  'finish' });
        console.log('EndRecord');
        isRecording = false;
        startBtn.removeAttribute('disabled');
        stopBtn.setAttribute('disabled', true);
        audioContext.close();
        processor.disconnect();
        tracks.forEach(track => track.stop());

        //audioElement.src = URL.createObjectURL(encoder.finish());
			};

}
