'use strict'

var socket = io();

socket.on('connect', function() {
    console.log("connected microphone client");
});

var recordingStatus = false;
var recordingStatusIndicator = document.getElementById('recording-status');
recordingStatusIndicator.style.visibility = "hidden";
var startStreamingButton = document.getElementById('start-streaming');
var resultText = document.getElementById('resultText');

startStreamingButton.onclick = function() {
  if(!recordingStatus){
    console.log("start streaming");
    startStreaming();
    microphoneIcon.style.color = "LimeGreen";
    resultText.innerHTML = "";
    recordingStatus = true;
  }
  else {
    console.log("stop streaming");
    stopStreaming();
    microphoneIcon.style.color = "DodgerBlue";
    recordingStatus = false;
  }



}

let bufferSize = 2048,
	AudioContext,
	context,
	processor,
	input,
	globalStream;

let audioElement = document.querySelector('audio'),
	finalWord = false,
	removeLastSentence = true,
	streamStreaming = false;

const constraints = {
	audio: true,
	video: false
};

function initRecording() {
	socket.emit('startStream', '');
	streamStreaming = true;
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	processor = context.createScriptProcessor(bufferSize, 1, 1);
	processor.connect(context.destination);
	context.resume();

	var handleSuccess = function (stream) {
		globalStream = stream;
		input = context.createMediaStreamSource(stream);
		input.connect(processor);

		processor.onaudioprocess = function (e) {
			microphoneProcess(e);
		};
	};

	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleSuccess);
}

function microphoneProcess(e) {
	var left = e.inputBuffer.getChannelData(0);
	var left16 = downsampleBuffer(left, 44100, 16000)
	socket.emit('binaryStream', left16);
}


function startStreaming() {
	startStreaming.disabled = true;
	stopStreaming.disabled = false;
	recordingStatusIndicator.style.visibility = "visible";
	initRecording();
}

function stopStreaming() {

	startStreaming.disabled = false;
	stopStreaming.disabled = true;
	recordingStatusIndicator.style.visibility = "hidden";
	streamStreaming = false;
	socket.emit('stopStream', '');

	let track = globalStream.getTracks()[0];
	track.stop();

	input.disconnect(processor);
	processor.disconnect(context.destination);
	context.close().then(function () {
		input = null;
		processor = null;
		context = null;
		AudioContext = null;
		startStreaming.disabled = false;
	});
}

socket.on('transcription', function (data) {
	console.log(data);
  resultText.innerHTML = data;
});

window.onbeforeunload = function () {
	if (streamStreaming) { socket.emit('stopStream', ''); }
};

var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
    if (outSampleRate == sampleRate) {
        return buffer;
    }
    if (outSampleRate > sampleRate) {
        throw "downsampling rate show be smaller than original sample rate";
    }
    var sampleRateRatio = sampleRate / outSampleRate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Int16Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
        var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        var accum = 0, count = 0;
        for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }

        result[offsetResult] = Math.min(1, accum / count)*0x7FFF;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
}
