importScripts('Mp3LameEncoder.js');

var buffers = undefined,
    encoder = undefined;

self.onmessage = function(event) {
  var data = event.data;
  switch (data.command) {
    case 'start':
      encoder = new Mp3LameEncoder(data.sampleRate, data.bitRate);
      buffers =  [] ;
      break;
    case 'record':
      if (buffers != null)
        buffers.push(data.buffers);
      break;
    case 'finish':
      if (buffers != null)
        while (buffers.length > 0)
          encoder.encode(buffers.shift());
      self.postMessage({ blob: encoder.finish('audio/mpeg') });
      encoder = undefined;
      break;
    case 'cancel':
      encoder.cancel(); 
      encoder = undefined;
  }
};
