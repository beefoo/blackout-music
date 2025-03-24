var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/midi-file/lib/midi-parser.js
var require_midi_parser = __commonJS({
  "node_modules/midi-file/lib/midi-parser.js"(exports, module) {
    function parseMidi2(data) {
      var p = new Parser(data);
      var headerChunk = p.readChunk();
      if (headerChunk.id != "MThd")
        throw "Bad MIDI file.  Expected 'MHdr', got: '" + headerChunk.id + "'";
      var header = parseHeader(headerChunk.data);
      var tracks = [];
      for (var i = 0; !p.eof() && i < header.numTracks; i++) {
        var trackChunk = p.readChunk();
        if (trackChunk.id != "MTrk")
          throw "Bad MIDI file.  Expected 'MTrk', got: '" + trackChunk.id + "'";
        var track = parseTrack(trackChunk.data);
        tracks.push(track);
      }
      return {
        header,
        tracks
      };
    }
    function parseHeader(data) {
      var p = new Parser(data);
      var format = p.readUInt16();
      var numTracks = p.readUInt16();
      var result = {
        format,
        numTracks
      };
      var timeDivision = p.readUInt16();
      if (timeDivision & 32768) {
        result.framesPerSecond = 256 - (timeDivision >> 8);
        result.ticksPerFrame = timeDivision & 255;
      } else {
        result.ticksPerBeat = timeDivision;
      }
      return result;
    }
    function parseTrack(data) {
      var p = new Parser(data);
      var events = [];
      while (!p.eof()) {
        var event = readEvent();
        events.push(event);
      }
      return events;
      var lastEventTypeByte = null;
      function readEvent() {
        var event2 = {};
        event2.deltaTime = p.readVarInt();
        var eventTypeByte = p.readUInt8();
        if ((eventTypeByte & 240) === 240) {
          if (eventTypeByte === 255) {
            event2.meta = true;
            var metatypeByte = p.readUInt8();
            var length = p.readVarInt();
            switch (metatypeByte) {
              case 0:
                event2.type = "sequenceNumber";
                if (length !== 2) throw "Expected length for sequenceNumber event is 2, got " + length;
                event2.number = p.readUInt16();
                return event2;
              case 1:
                event2.type = "text";
                event2.text = p.readString(length);
                return event2;
              case 2:
                event2.type = "copyrightNotice";
                event2.text = p.readString(length);
                return event2;
              case 3:
                event2.type = "trackName";
                event2.text = p.readString(length);
                return event2;
              case 4:
                event2.type = "instrumentName";
                event2.text = p.readString(length);
                return event2;
              case 5:
                event2.type = "lyrics";
                event2.text = p.readString(length);
                return event2;
              case 6:
                event2.type = "marker";
                event2.text = p.readString(length);
                return event2;
              case 7:
                event2.type = "cuePoint";
                event2.text = p.readString(length);
                return event2;
              case 32:
                event2.type = "channelPrefix";
                if (length != 1) throw "Expected length for channelPrefix event is 1, got " + length;
                event2.channel = p.readUInt8();
                return event2;
              case 33:
                event2.type = "portPrefix";
                if (length != 1) throw "Expected length for portPrefix event is 1, got " + length;
                event2.port = p.readUInt8();
                return event2;
              case 47:
                event2.type = "endOfTrack";
                if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
                return event2;
              case 81:
                event2.type = "setTempo";
                if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
                event2.microsecondsPerBeat = p.readUInt24();
                return event2;
              case 84:
                event2.type = "smpteOffset";
                if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
                var hourByte = p.readUInt8();
                var FRAME_RATES = { 0: 24, 32: 25, 64: 29, 96: 30 };
                event2.frameRate = FRAME_RATES[hourByte & 96];
                event2.hour = hourByte & 31;
                event2.min = p.readUInt8();
                event2.sec = p.readUInt8();
                event2.frame = p.readUInt8();
                event2.subFrame = p.readUInt8();
                return event2;
              case 88:
                event2.type = "timeSignature";
                if (length != 2 && length != 4) throw "Expected length for timeSignature event is 4 or 2, got " + length;
                event2.numerator = p.readUInt8();
                event2.denominator = 1 << p.readUInt8();
                if (length === 4) {
                  event2.metronome = p.readUInt8();
                  event2.thirtyseconds = p.readUInt8();
                } else {
                  event2.metronome = 36;
                  event2.thirtyseconds = 8;
                }
                return event2;
              case 89:
                event2.type = "keySignature";
                if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
                event2.key = p.readInt8();
                event2.scale = p.readUInt8();
                return event2;
              case 127:
                event2.type = "sequencerSpecific";
                event2.data = p.readBytes(length);
                return event2;
              default:
                event2.type = "unknownMeta";
                event2.data = p.readBytes(length);
                event2.metatypeByte = metatypeByte;
                return event2;
            }
          } else if (eventTypeByte == 240) {
            event2.type = "sysEx";
            var length = p.readVarInt();
            event2.data = p.readBytes(length);
            return event2;
          } else if (eventTypeByte == 247) {
            event2.type = "endSysEx";
            var length = p.readVarInt();
            event2.data = p.readBytes(length);
            return event2;
          } else {
            throw "Unrecognised MIDI event type byte: " + eventTypeByte;
          }
        } else {
          var param1;
          if ((eventTypeByte & 128) === 0) {
            if (lastEventTypeByte === null)
              throw "Running status byte encountered before status byte";
            param1 = eventTypeByte;
            eventTypeByte = lastEventTypeByte;
            event2.running = true;
          } else {
            param1 = p.readUInt8();
            lastEventTypeByte = eventTypeByte;
          }
          var eventType = eventTypeByte >> 4;
          event2.channel = eventTypeByte & 15;
          switch (eventType) {
            case 8:
              event2.type = "noteOff";
              event2.noteNumber = param1;
              event2.velocity = p.readUInt8();
              return event2;
            case 9:
              var velocity = p.readUInt8();
              event2.type = velocity === 0 ? "noteOff" : "noteOn";
              event2.noteNumber = param1;
              event2.velocity = velocity;
              if (velocity === 0) event2.byte9 = true;
              return event2;
            case 10:
              event2.type = "noteAftertouch";
              event2.noteNumber = param1;
              event2.amount = p.readUInt8();
              return event2;
            case 11:
              event2.type = "controller";
              event2.controllerType = param1;
              event2.value = p.readUInt8();
              return event2;
            case 12:
              event2.type = "programChange";
              event2.programNumber = param1;
              return event2;
            case 13:
              event2.type = "channelAftertouch";
              event2.amount = param1;
              return event2;
            case 14:
              event2.type = "pitchBend";
              event2.value = param1 + (p.readUInt8() << 7) - 8192;
              return event2;
            default:
              throw "Unrecognised MIDI event type: " + eventType;
          }
        }
      }
    }
    function Parser(data) {
      this.buffer = data;
      this.bufferLen = this.buffer.length;
      this.pos = 0;
    }
    Parser.prototype.eof = function() {
      return this.pos >= this.bufferLen;
    };
    Parser.prototype.readUInt8 = function() {
      var result = this.buffer[this.pos];
      this.pos += 1;
      return result;
    };
    Parser.prototype.readInt8 = function() {
      var u = this.readUInt8();
      if (u & 128)
        return u - 256;
      else
        return u;
    };
    Parser.prototype.readUInt16 = function() {
      var b0 = this.readUInt8(), b1 = this.readUInt8();
      return (b0 << 8) + b1;
    };
    Parser.prototype.readInt16 = function() {
      var u = this.readUInt16();
      if (u & 32768)
        return u - 65536;
      else
        return u;
    };
    Parser.prototype.readUInt24 = function() {
      var b0 = this.readUInt8(), b1 = this.readUInt8(), b2 = this.readUInt8();
      return (b0 << 16) + (b1 << 8) + b2;
    };
    Parser.prototype.readInt24 = function() {
      var u = this.readUInt24();
      if (u & 8388608)
        return u - 16777216;
      else
        return u;
    };
    Parser.prototype.readUInt32 = function() {
      var b0 = this.readUInt8(), b1 = this.readUInt8(), b2 = this.readUInt8(), b3 = this.readUInt8();
      return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
    };
    Parser.prototype.readBytes = function(len) {
      var bytes = this.buffer.slice(this.pos, this.pos + len);
      this.pos += len;
      return bytes;
    };
    Parser.prototype.readString = function(len) {
      var bytes = this.readBytes(len);
      return String.fromCharCode.apply(null, bytes);
    };
    Parser.prototype.readVarInt = function() {
      var result = 0;
      while (!this.eof()) {
        var b = this.readUInt8();
        if (b & 128) {
          result += b & 127;
          result <<= 7;
        } else {
          return result + b;
        }
      }
      return result;
    };
    Parser.prototype.readChunk = function() {
      var id = this.readString(4);
      var length = this.readUInt32();
      var data = this.readBytes(length);
      return {
        id,
        length,
        data
      };
    };
    module.exports = parseMidi2;
  }
});

// node_modules/midi-file/lib/midi-writer.js
var require_midi_writer = __commonJS({
  "node_modules/midi-file/lib/midi-writer.js"(exports, module) {
    function writeMidi2(data, opts) {
      if (typeof data !== "object")
        throw "Invalid MIDI data";
      opts = opts || {};
      var header = data.header || {};
      var tracks = data.tracks || [];
      var i, len = tracks.length;
      var w = new Writer();
      writeHeader(w, header, len);
      for (i = 0; i < len; i++) {
        writeTrack(w, tracks[i], opts);
      }
      return w.buffer;
    }
    function writeHeader(w, header, numTracks) {
      var format = header.format == null ? 1 : header.format;
      var timeDivision = 128;
      if (header.timeDivision) {
        timeDivision = header.timeDivision;
      } else if (header.ticksPerFrame && header.framesPerSecond) {
        timeDivision = -(header.framesPerSecond & 255) << 8 | header.ticksPerFrame & 255;
      } else if (header.ticksPerBeat) {
        timeDivision = header.ticksPerBeat & 32767;
      }
      var h = new Writer();
      h.writeUInt16(format);
      h.writeUInt16(numTracks);
      h.writeUInt16(timeDivision);
      w.writeChunk("MThd", h.buffer);
    }
    function writeTrack(w, track, opts) {
      var t = new Writer();
      var i, len = track.length;
      var eventTypeByte = null;
      for (i = 0; i < len; i++) {
        if (opts.running === false || !opts.running && !track[i].running) eventTypeByte = null;
        eventTypeByte = writeEvent(t, track[i], eventTypeByte, opts.useByte9ForNoteOff);
      }
      w.writeChunk("MTrk", t.buffer);
    }
    function writeEvent(w, event, lastEventTypeByte, useByte9ForNoteOff) {
      var type = event.type;
      var deltaTime = event.deltaTime;
      var text = event.text || "";
      var data = event.data || [];
      var eventTypeByte = null;
      w.writeVarInt(deltaTime);
      switch (type) {
        // meta events
        case "sequenceNumber":
          w.writeUInt8(255);
          w.writeUInt8(0);
          w.writeVarInt(2);
          w.writeUInt16(event.number);
          break;
        case "text":
          w.writeUInt8(255);
          w.writeUInt8(1);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "copyrightNotice":
          w.writeUInt8(255);
          w.writeUInt8(2);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "trackName":
          w.writeUInt8(255);
          w.writeUInt8(3);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "instrumentName":
          w.writeUInt8(255);
          w.writeUInt8(4);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "lyrics":
          w.writeUInt8(255);
          w.writeUInt8(5);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "marker":
          w.writeUInt8(255);
          w.writeUInt8(6);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "cuePoint":
          w.writeUInt8(255);
          w.writeUInt8(7);
          w.writeVarInt(text.length);
          w.writeString(text);
          break;
        case "channelPrefix":
          w.writeUInt8(255);
          w.writeUInt8(32);
          w.writeVarInt(1);
          w.writeUInt8(event.channel);
          break;
        case "portPrefix":
          w.writeUInt8(255);
          w.writeUInt8(33);
          w.writeVarInt(1);
          w.writeUInt8(event.port);
          break;
        case "endOfTrack":
          w.writeUInt8(255);
          w.writeUInt8(47);
          w.writeVarInt(0);
          break;
        case "setTempo":
          w.writeUInt8(255);
          w.writeUInt8(81);
          w.writeVarInt(3);
          w.writeUInt24(event.microsecondsPerBeat);
          break;
        case "smpteOffset":
          w.writeUInt8(255);
          w.writeUInt8(84);
          w.writeVarInt(5);
          var FRAME_RATES = { 24: 0, 25: 32, 29: 64, 30: 96 };
          var hourByte = event.hour & 31 | FRAME_RATES[event.frameRate];
          w.writeUInt8(hourByte);
          w.writeUInt8(event.min);
          w.writeUInt8(event.sec);
          w.writeUInt8(event.frame);
          w.writeUInt8(event.subFrame);
          break;
        case "timeSignature":
          w.writeUInt8(255);
          w.writeUInt8(88);
          w.writeVarInt(4);
          w.writeUInt8(event.numerator);
          var denominator = Math.floor(Math.log(event.denominator) / Math.LN2) & 255;
          w.writeUInt8(denominator);
          w.writeUInt8(event.metronome);
          w.writeUInt8(event.thirtyseconds || 8);
          break;
        case "keySignature":
          w.writeUInt8(255);
          w.writeUInt8(89);
          w.writeVarInt(2);
          w.writeInt8(event.key);
          w.writeUInt8(event.scale);
          break;
        case "sequencerSpecific":
          w.writeUInt8(255);
          w.writeUInt8(127);
          w.writeVarInt(data.length);
          w.writeBytes(data);
          break;
        case "unknownMeta":
          if (event.metatypeByte != null) {
            w.writeUInt8(255);
            w.writeUInt8(event.metatypeByte);
            w.writeVarInt(data.length);
            w.writeBytes(data);
          }
          break;
        // system-exclusive
        case "sysEx":
          w.writeUInt8(240);
          w.writeVarInt(data.length);
          w.writeBytes(data);
          break;
        case "endSysEx":
          w.writeUInt8(247);
          w.writeVarInt(data.length);
          w.writeBytes(data);
          break;
        // channel events
        case "noteOff":
          var noteByte = useByte9ForNoteOff !== false && event.byte9 || useByte9ForNoteOff && event.velocity == 0 ? 144 : 128;
          eventTypeByte = noteByte | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.noteNumber);
          w.writeUInt8(event.velocity);
          break;
        case "noteOn":
          eventTypeByte = 144 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.noteNumber);
          w.writeUInt8(event.velocity);
          break;
        case "noteAftertouch":
          eventTypeByte = 160 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.noteNumber);
          w.writeUInt8(event.amount);
          break;
        case "controller":
          eventTypeByte = 176 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.controllerType);
          w.writeUInt8(event.value);
          break;
        case "programChange":
          eventTypeByte = 192 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.programNumber);
          break;
        case "channelAftertouch":
          eventTypeByte = 208 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          w.writeUInt8(event.amount);
          break;
        case "pitchBend":
          eventTypeByte = 224 | event.channel;
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte);
          var value14 = 8192 + event.value;
          var lsb14 = value14 & 127;
          var msb14 = value14 >> 7 & 127;
          w.writeUInt8(lsb14);
          w.writeUInt8(msb14);
          break;
        default:
          throw "Unrecognized event type: " + type;
      }
      return eventTypeByte;
    }
    function Writer() {
      this.buffer = [];
    }
    Writer.prototype.writeUInt8 = function(v) {
      this.buffer.push(v & 255);
    };
    Writer.prototype.writeInt8 = Writer.prototype.writeUInt8;
    Writer.prototype.writeUInt16 = function(v) {
      var b0 = v >> 8 & 255, b1 = v & 255;
      this.writeUInt8(b0);
      this.writeUInt8(b1);
    };
    Writer.prototype.writeInt16 = Writer.prototype.writeUInt16;
    Writer.prototype.writeUInt24 = function(v) {
      var b0 = v >> 16 & 255, b1 = v >> 8 & 255, b2 = v & 255;
      this.writeUInt8(b0);
      this.writeUInt8(b1);
      this.writeUInt8(b2);
    };
    Writer.prototype.writeInt24 = Writer.prototype.writeUInt24;
    Writer.prototype.writeUInt32 = function(v) {
      var b0 = v >> 24 & 255, b1 = v >> 16 & 255, b2 = v >> 8 & 255, b3 = v & 255;
      this.writeUInt8(b0);
      this.writeUInt8(b1);
      this.writeUInt8(b2);
      this.writeUInt8(b3);
    };
    Writer.prototype.writeInt32 = Writer.prototype.writeUInt32;
    Writer.prototype.writeBytes = function(arr) {
      this.buffer = this.buffer.concat(Array.prototype.slice.call(arr, 0));
    };
    Writer.prototype.writeString = function(str) {
      var i, len = str.length, arr = [];
      for (i = 0; i < len; i++) {
        arr.push(str.codePointAt(i));
      }
      this.writeBytes(arr);
    };
    Writer.prototype.writeVarInt = function(v) {
      if (v < 0) throw "Cannot write negative variable-length integer";
      if (v <= 127) {
        this.writeUInt8(v);
      } else {
        var i = v;
        var bytes = [];
        bytes.push(i & 127);
        i >>= 7;
        while (i) {
          var b = i & 127 | 128;
          bytes.push(b);
          i >>= 7;
        }
        this.writeBytes(bytes.reverse());
      }
    };
    Writer.prototype.writeChunk = function(id, data) {
      this.writeString(id);
      this.writeUInt32(data.length);
      this.writeBytes(data);
    };
    module.exports = writeMidi2;
  }
});

// node_modules/midi-file/index.js
var require_midi_file = __commonJS({
  "node_modules/midi-file/index.js"(exports) {
    exports.parseMidi = require_midi_parser();
    exports.writeMidi = require_midi_writer();
  }
});

// node_modules/@tonejs/midi/src/Midi.ts
var import_midi_file2 = __toESM(require_midi_file());

// node_modules/@tonejs/midi/src/BinarySearch.ts
function search(array, value, prop = "ticks") {
  let beginning = 0;
  const len = array.length;
  let end = len;
  if (len > 0 && array[len - 1][prop] <= value) {
    return len - 1;
  }
  while (beginning < end) {
    let midPoint = Math.floor(beginning + (end - beginning) / 2);
    const event = array[midPoint];
    const nextEvent = array[midPoint + 1];
    if (event[prop] === value) {
      for (let i = midPoint; i < array.length; i++) {
        const testEvent = array[i];
        if (testEvent[prop] === value) {
          midPoint = i;
        }
      }
      return midPoint;
    } else if (event[prop] < value && nextEvent[prop] > value) {
      return midPoint;
    } else if (event[prop] > value) {
      end = midPoint;
    } else if (event[prop] < value) {
      beginning = midPoint + 1;
    }
  }
  return -1;
}
function insert(array, event, prop = "ticks") {
  if (array.length) {
    const index = search(array, event[prop], prop);
    array.splice(index + 1, 0, event);
  } else {
    array.push(event);
  }
}

// node_modules/@tonejs/midi/src/Header.ts
var privatePPQMap = /* @__PURE__ */ new WeakMap();
var keySignatureKeys = [
  "Cb",
  "Gb",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#"
];
var Header = class {
  /**
   * The array of all the tempo events.
   */
  tempos = [];
  /**
   * The time signatures.
   */
  timeSignatures = [];
  /**
   * The time signatures.
   */
  keySignatures = [];
  /**
   * Additional meta events.
   */
  meta = [];
  /**
   * The name of the MIDI file;
   */
  name = "";
  constructor(midiData) {
    privatePPQMap.set(this, 480);
    if (midiData) {
      privatePPQMap.set(this, midiData.header.ticksPerBeat);
      midiData.tracks.forEach((track) => {
        track.forEach((event) => {
          if (event.meta) {
            if (event.type === "timeSignature") {
              this.timeSignatures.push({
                ticks: event.absoluteTime,
                timeSignature: [
                  event.numerator,
                  event.denominator
                ]
              });
            } else if (event.type === "setTempo") {
              this.tempos.push({
                bpm: 6e7 / event.microsecondsPerBeat,
                ticks: event.absoluteTime
              });
            } else if (event.type === "keySignature") {
              this.keySignatures.push({
                key: keySignatureKeys[event.key + 7],
                scale: event.scale === 0 ? "major" : "minor",
                ticks: event.absoluteTime
              });
            }
          }
        });
      });
      let firstTrackCurrentTicks = 0;
      midiData.tracks[0].forEach((event) => {
        firstTrackCurrentTicks += event.deltaTime;
        if (event.meta) {
          if (event.type === "trackName") {
            this.name = event.text;
          } else if (event.type === "text" || event.type === "cuePoint" || event.type === "marker" || event.type === "lyrics") {
            this.meta.push({
              text: event.text,
              ticks: firstTrackCurrentTicks,
              type: event.type
            });
          }
        }
      });
      this.update();
    }
  }
  /**
   * This must be invoked after any changes are made to the tempo array
   * or the timeSignature array for the updated values to be reflected.
   */
  update() {
    let currentTime = 0;
    let lastEventBeats = 0;
    this.tempos.sort((a, b) => a.ticks - b.ticks);
    this.tempos.forEach((event, index) => {
      const lastBPM = index > 0 ? this.tempos[index - 1].bpm : this.tempos[0].bpm;
      const beats = event.ticks / this.ppq - lastEventBeats;
      const elapsedSeconds = 60 / lastBPM * beats;
      event.time = elapsedSeconds + currentTime;
      currentTime = event.time;
      lastEventBeats += beats;
    });
    this.timeSignatures.sort((a, b) => a.ticks - b.ticks);
    this.timeSignatures.forEach((event, index) => {
      const lastEvent = index > 0 ? this.timeSignatures[index - 1] : this.timeSignatures[0];
      const elapsedBeats = (event.ticks - lastEvent.ticks) / this.ppq;
      const elapsedMeasures = elapsedBeats / lastEvent.timeSignature[0] / (lastEvent.timeSignature[1] / 4);
      lastEvent.measures = lastEvent.measures || 0;
      event.measures = elapsedMeasures + lastEvent.measures;
    });
  }
  /**
   * Convert ticks into seconds based on the tempo changes.
   */
  ticksToSeconds(ticks) {
    const index = search(this.tempos, ticks);
    if (index !== -1) {
      const tempo = this.tempos[index];
      const tempoTime = tempo.time;
      const elapsedBeats = (ticks - tempo.ticks) / this.ppq;
      return tempoTime + 60 / tempo.bpm * elapsedBeats;
    } else {
      const beats = ticks / this.ppq;
      return 60 / 120 * beats;
    }
  }
  /**
   * Convert ticks into measures based off of the time signatures.
   */
  ticksToMeasures(ticks) {
    const index = search(this.timeSignatures, ticks);
    if (index !== -1) {
      const timeSigEvent = this.timeSignatures[index];
      const elapsedBeats = (ticks - timeSigEvent.ticks) / this.ppq;
      return timeSigEvent.measures + elapsedBeats / (timeSigEvent.timeSignature[0] / timeSigEvent.timeSignature[1]) / 4;
    } else {
      return ticks / this.ppq / 4;
    }
  }
  /**
   * The number of ticks per quarter note.
   */
  get ppq() {
    return privatePPQMap.get(this);
  }
  /**
   * Convert seconds to ticks based on the tempo events.
   */
  secondsToTicks(seconds) {
    const index = search(this.tempos, seconds, "time");
    if (index !== -1) {
      const tempo = this.tempos[index];
      const tempoTime = tempo.time;
      const elapsedTime = seconds - tempoTime;
      const elapsedBeats = elapsedTime / (60 / tempo.bpm);
      return Math.round(tempo.ticks + elapsedBeats * this.ppq);
    } else {
      const beats = seconds / (60 / 120);
      return Math.round(beats * this.ppq);
    }
  }
  /**
   * Convert the header into an object.
   */
  toJSON() {
    return {
      keySignatures: this.keySignatures,
      meta: this.meta,
      name: this.name,
      ppq: this.ppq,
      tempos: this.tempos.map((t) => {
        return {
          bpm: t.bpm,
          ticks: t.ticks
        };
      }),
      timeSignatures: this.timeSignatures
    };
  }
  /**
   * Parse a header json object.
   */
  fromJSON(json) {
    this.name = json.name;
    this.tempos = json.tempos.map((t) => Object.assign({}, t));
    this.timeSignatures = json.timeSignatures.map(
      (t) => Object.assign({}, t)
    );
    this.keySignatures = json.keySignatures.map(
      (t) => Object.assign({}, t)
    );
    this.meta = json.meta.map((t) => Object.assign({}, t));
    privatePPQMap.set(this, json.ppq);
    this.update();
  }
  /**
   * Update the tempo of the midi to a single tempo. Will remove and replace
   * any other tempos currently set and update all of the event timing.
   * @param bpm The tempo in beats per second.
   */
  setTempo(bpm) {
    this.tempos = [
      {
        bpm,
        ticks: 0
      }
    ];
    this.update();
  }
};

// node_modules/@tonejs/midi/src/ControlChange.ts
var controlChangeNames = {
  1: "modulationWheel",
  2: "breath",
  4: "footController",
  5: "portamentoTime",
  7: "volume",
  8: "balance",
  10: "pan",
  64: "sustain",
  65: "portamentoTime",
  66: "sostenuto",
  67: "softPedal",
  68: "legatoFootswitch",
  84: "portamentoControl"
};
var controlChangeIds = Object.keys(controlChangeNames).reduce((obj, key) => {
  obj[controlChangeNames[key]] = key;
  return obj;
}, {});
var privateHeaderMap = /* @__PURE__ */ new WeakMap();
var privateCCNumberMap = /* @__PURE__ */ new WeakMap();
var ControlChange = class {
  /**
   * The number value of the event
   */
  value;
  /**
   * The tick time of the event
   */
  ticks;
  /**
   * @param event
   * @param header
   */
  constructor(event, header) {
    privateHeaderMap.set(this, header);
    privateCCNumberMap.set(this, event.controllerType);
    this.ticks = event.absoluteTime;
    this.value = event.value;
  }
  /**
   * The controller number
   */
  get number() {
    return privateCCNumberMap.get(this);
  }
  /**
   * return the common name of the control number if it exists
   */
  get name() {
    if (controlChangeNames[this.number]) {
      return controlChangeNames[this.number];
    } else {
      return null;
    }
  }
  /**
   * The time of the event in seconds
   */
  get time() {
    const header = privateHeaderMap.get(this);
    return header.ticksToSeconds(this.ticks);
  }
  set time(t) {
    const header = privateHeaderMap.get(this);
    this.ticks = header.secondsToTicks(t);
  }
  toJSON() {
    return {
      number: this.number,
      ticks: this.ticks,
      time: this.time,
      value: this.value
    };
  }
};

// node_modules/@tonejs/midi/src/ControlChanges.ts
function createControlChanges() {
  return new Proxy({}, {
    // tslint:disable-next-line: typedef
    get(target, handler) {
      if (target[handler]) {
        return target[handler];
      } else if (controlChangeIds.hasOwnProperty(handler)) {
        return target[controlChangeIds[handler]];
      }
    },
    // tslint:disable-next-line: typedef
    set(target, handler, value) {
      if (controlChangeIds.hasOwnProperty(handler)) {
        target[controlChangeIds[handler]] = value;
      } else {
        target[handler] = value;
      }
      return true;
    }
  });
}

// node_modules/@tonejs/midi/src/PitchBend.ts
var privateHeaderMap2 = /* @__PURE__ */ new WeakMap();
var PitchBend = class {
  /**
   * The pitch value from...
   */
  value;
  /**
   * The tick time of the event.
   */
  ticks;
  /**
   * @param event
   * @param header
   */
  constructor(event, header) {
    privateHeaderMap2.set(this, header);
    this.ticks = event.absoluteTime;
    this.value = event.value;
  }
  /**
   * The time of the event in seconds
   */
  get time() {
    const header = privateHeaderMap2.get(this);
    return header.ticksToSeconds(this.ticks);
  }
  set time(t) {
    const header = privateHeaderMap2.get(this);
    this.ticks = header.secondsToTicks(t);
  }
  toJSON() {
    return {
      ticks: this.ticks,
      time: this.time,
      value: this.value
    };
  }
};

// node_modules/@tonejs/midi/src/InstrumentMaps.ts
var instrumentByPatchID = [
  "acoustic grand piano",
  "bright acoustic piano",
  "electric grand piano",
  "honky-tonk piano",
  "electric piano 1",
  "electric piano 2",
  "harpsichord",
  "clavi",
  "celesta",
  "glockenspiel",
  "music box",
  "vibraphone",
  "marimba",
  "xylophone",
  "tubular bells",
  "dulcimer",
  "drawbar organ",
  "percussive organ",
  "rock organ",
  "church organ",
  "reed organ",
  "accordion",
  "harmonica",
  "tango accordion",
  "acoustic guitar (nylon)",
  "acoustic guitar (steel)",
  "electric guitar (jazz)",
  "electric guitar (clean)",
  "electric guitar (muted)",
  "overdriven guitar",
  "distortion guitar",
  "guitar harmonics",
  "acoustic bass",
  "electric bass (finger)",
  "electric bass (pick)",
  "fretless bass",
  "slap bass 1",
  "slap bass 2",
  "synth bass 1",
  "synth bass 2",
  "violin",
  "viola",
  "cello",
  "contrabass",
  "tremolo strings",
  "pizzicato strings",
  "orchestral harp",
  "timpani",
  "string ensemble 1",
  "string ensemble 2",
  "synthstrings 1",
  "synthstrings 2",
  "choir aahs",
  "voice oohs",
  "synth voice",
  "orchestra hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted trumpet",
  "french horn",
  "brass section",
  "synthbrass 1",
  "synthbrass 2",
  "soprano sax",
  "alto sax",
  "tenor sax",
  "baritone sax",
  "oboe",
  "english horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute",
  "recorder",
  "pan flute",
  "blown bottle",
  "shakuhachi",
  "whistle",
  "ocarina",
  "lead 1 (square)",
  "lead 2 (sawtooth)",
  "lead 3 (calliope)",
  "lead 4 (chiff)",
  "lead 5 (charang)",
  "lead 6 (voice)",
  "lead 7 (fifths)",
  "lead 8 (bass + lead)",
  "pad 1 (new age)",
  "pad 2 (warm)",
  "pad 3 (polysynth)",
  "pad 4 (choir)",
  "pad 5 (bowed)",
  "pad 6 (metallic)",
  "pad 7 (halo)",
  "pad 8 (sweep)",
  "fx 1 (rain)",
  "fx 2 (soundtrack)",
  "fx 3 (crystal)",
  "fx 4 (atmosphere)",
  "fx 5 (brightness)",
  "fx 6 (goblins)",
  "fx 7 (echoes)",
  "fx 8 (sci-fi)",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bag pipe",
  "fiddle",
  "shanai",
  "tinkle bell",
  "agogo",
  "steel drums",
  "woodblock",
  "taiko drum",
  "melodic tom",
  "synth drum",
  "reverse cymbal",
  "guitar fret noise",
  "breath noise",
  "seashore",
  "bird tweet",
  "telephone ring",
  "helicopter",
  "applause",
  "gunshot"
];
var InstrumentFamilyByID = [
  "piano",
  "chromatic percussion",
  "organ",
  "guitar",
  "bass",
  "strings",
  "ensemble",
  "brass",
  "reed",
  "pipe",
  "synth lead",
  "synth pad",
  "synth effects",
  "world",
  "percussive",
  "sound effects"
];
var DrumKitByPatchID = {
  0: "standard kit",
  8: "room kit",
  16: "power kit",
  24: "electronic kit",
  25: "tr-808 kit",
  32: "jazz kit",
  40: "brush kit",
  48: "orchestra kit",
  56: "sound fx kit"
};

// node_modules/@tonejs/midi/src/Instrument.ts
var privateTrackMap = /* @__PURE__ */ new WeakMap();
var Instrument = class {
  /**
   * The instrument number. Defaults to 0.
   */
  number = 0;
  /**
   * @param trackData
   * @param track 
   */
  constructor(trackData, track) {
    privateTrackMap.set(this, track);
    this.number = 0;
    if (trackData) {
      const programChange = trackData.find(
        (e) => e.type === "programChange"
      );
      if (programChange) {
        this.number = programChange.programNumber;
      }
    }
  }
  /**
   * The common name of the instrument.
   */
  get name() {
    if (this.percussion) {
      return DrumKitByPatchID[this.number];
    } else {
      return instrumentByPatchID[this.number];
    }
  }
  set name(n) {
    const patchNumber = instrumentByPatchID.indexOf(n);
    if (patchNumber !== -1) {
      this.number = patchNumber;
    }
  }
  /**
   * The instrument family, e.g. "piano".
   */
  get family() {
    if (this.percussion) {
      return "drums";
    } else {
      return InstrumentFamilyByID[Math.floor(this.number / 8)];
    }
  }
  /**
   * If the instrument is a percussion instrument.
   */
  get percussion() {
    const track = privateTrackMap.get(this);
    return track.channel === 9;
  }
  /**
   * Convert it to JSON form.
   */
  toJSON() {
    return {
      family: this.family,
      number: this.number,
      name: this.name
    };
  }
  /**
   * Convert from JSON form.
   */
  fromJSON(json) {
    this.number = json.number;
  }
};

// node_modules/@tonejs/midi/src/Note.ts
function midiToPitch(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return midiToPitchClass(midi) + octave.toString();
}
function midiToPitchClass(midi) {
  const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const note = midi % 12;
  return scaleIndexToNote[note];
}
function pitchClassToMidi(pitch) {
  const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return scaleIndexToNote.indexOf(pitch);
}
var pitchToMidi = /* @__PURE__ */ function() {
  const regexp = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;
  const noteToScaleIndex = {
    // tslint:disable-next-line: object-literal-sort-keys
    cbb: -2,
    cb: -1,
    c: 0,
    "c#": 1,
    cx: 2,
    dbb: 0,
    db: 1,
    d: 2,
    "d#": 3,
    dx: 4,
    ebb: 2,
    eb: 3,
    e: 4,
    "e#": 5,
    ex: 6,
    fbb: 3,
    fb: 4,
    f: 5,
    "f#": 6,
    fx: 7,
    gbb: 5,
    gb: 6,
    g: 7,
    "g#": 8,
    gx: 9,
    abb: 7,
    ab: 8,
    a: 9,
    "a#": 10,
    ax: 11,
    bbb: 9,
    bb: 10,
    b: 11,
    "b#": 12,
    bx: 13
  };
  return (note) => {
    const split = regexp.exec(note);
    const pitch = split[1];
    const octave = split[2];
    const index = noteToScaleIndex[pitch.toLowerCase()];
    return index + (parseInt(octave, 10) + 1) * 12;
  };
}();
var privateHeaderMap3 = /* @__PURE__ */ new WeakMap();
var Note = class {
  /**
   * The notes MIDI value.
   */
  midi;
  /**
   * The normalized velocity (0-1).
   */
  velocity;
  /**
   * The velocity of the note off.
   */
  noteOffVelocity;
  /**
   * The start time in ticks.
   */
  ticks;
  /**
   * The duration in ticks.
   */
  durationTicks;
  constructor(noteOn, noteOff, header) {
    privateHeaderMap3.set(this, header);
    this.midi = noteOn.midi;
    this.velocity = noteOn.velocity;
    this.noteOffVelocity = noteOff.velocity;
    this.ticks = noteOn.ticks;
    this.durationTicks = noteOff.ticks - noteOn.ticks;
  }
  /**
   * The note name and octave in scientific pitch notation, e.g. "C4".
   */
  get name() {
    return midiToPitch(this.midi);
  }
  set name(n) {
    this.midi = pitchToMidi(n);
  }
  /**
   * The notes octave number.
   */
  get octave() {
    return Math.floor(this.midi / 12) - 1;
  }
  set octave(o) {
    const diff = o - this.octave;
    this.midi += diff * 12;
  }
  /**
   * The pitch class name. e.g. "A".
   */
  get pitch() {
    return midiToPitchClass(this.midi);
  }
  set pitch(p) {
    this.midi = 12 * (this.octave + 1) + pitchClassToMidi(p);
  }
  /**
   * The duration of the segment in seconds.
   */
  get duration() {
    const header = privateHeaderMap3.get(this);
    return header.ticksToSeconds(this.ticks + this.durationTicks) - header.ticksToSeconds(this.ticks);
  }
  set duration(d) {
    const header = privateHeaderMap3.get(this);
    const noteEndTicks = header.secondsToTicks(this.time + d);
    this.durationTicks = noteEndTicks - this.ticks;
  }
  /**
   * The time of the event in seconds.
   */
  get time() {
    const header = privateHeaderMap3.get(this);
    return header.ticksToSeconds(this.ticks);
  }
  set time(t) {
    const header = privateHeaderMap3.get(this);
    this.ticks = header.secondsToTicks(t);
  }
  /**
   * The number of measures (and partial measures) to this beat.
   * Takes into account time signature changes.
   * @readonly
   */
  get bars() {
    const header = privateHeaderMap3.get(this);
    return header.ticksToMeasures(this.ticks);
  }
  toJSON() {
    return {
      duration: this.duration,
      durationTicks: this.durationTicks,
      midi: this.midi,
      name: this.name,
      ticks: this.ticks,
      time: this.time,
      velocity: this.velocity
    };
  }
};

// node_modules/@tonejs/midi/src/Track.ts
var privateHeaderMap4 = /* @__PURE__ */ new WeakMap();
var Track = class {
  /**
   * The name of the track.
   */
  name = "";
  /**
   * The instrument associated with the track.
   */
  instrument;
  /**
   * The track's note events.
   */
  notes = [];
  /**
   * The channel number of the track. Applies this channel
   * to all events associated with the channel.
   */
  channel;
  /**
   * The control change events.
   */
  controlChanges = createControlChanges();
  /**
   * The end of track event (if it exists) in ticks.
   */
  endOfTrackTicks;
  /**
   * The pitch bend events.
   */
  pitchBends = [];
  constructor(trackData, header) {
    privateHeaderMap4.set(this, header);
    if (trackData) {
      const nameEvent = trackData.find(
        (e) => e.type === "trackName"
      );
      this.name = nameEvent ? nameEvent.text : "";
    }
    this.instrument = new Instrument(trackData, this);
    this.channel = 0;
    if (trackData) {
      const noteOns = trackData.filter(
        (event) => event.type === "noteOn"
      );
      const noteOffs = trackData.filter(
        (event) => event.type === "noteOff"
      );
      while (noteOns.length) {
        const currentNote = noteOns.shift();
        this.channel = currentNote.channel;
        const offIndex = noteOffs.findIndex(
          (note) => note.noteNumber === currentNote.noteNumber && note.absoluteTime >= currentNote.absoluteTime
        );
        if (offIndex !== -1) {
          const noteOff = noteOffs.splice(offIndex, 1)[0];
          this.addNote({
            durationTicks: noteOff.absoluteTime - currentNote.absoluteTime,
            midi: currentNote.noteNumber,
            noteOffVelocity: noteOff.velocity / 127,
            ticks: currentNote.absoluteTime,
            velocity: currentNote.velocity / 127
          });
        }
      }
      const controlChanges = trackData.filter(
        (event) => event.type === "controller"
      );
      controlChanges.forEach((event) => {
        this.addCC({
          number: event.controllerType,
          ticks: event.absoluteTime,
          value: event.value / 127
        });
      });
      const pitchBends = trackData.filter(
        (event) => event.type === "pitchBend"
      );
      pitchBends.forEach((event) => {
        this.addPitchBend({
          ticks: event.absoluteTime,
          // Scale the value between -2^13 to 2^13 to -2 to 2.
          value: event.value / Math.pow(2, 13)
        });
      });
      const endOfTrackEvent = trackData.find(
        (event) => event.type === "endOfTrack"
      );
      this.endOfTrackTicks = endOfTrackEvent !== void 0 ? endOfTrackEvent.absoluteTime : void 0;
    }
  }
  /**
   * Add a note to the notes array.
   * @param props The note properties to add.
   */
  addNote(props) {
    const header = privateHeaderMap4.get(this);
    const note = new Note(
      {
        midi: 0,
        ticks: 0,
        velocity: 1
      },
      {
        ticks: 0,
        velocity: 0
      },
      header
    );
    Object.assign(note, props);
    insert(this.notes, note, "ticks");
    return this;
  }
  /**
   * Add a control change to the track.
   * @param props
   */
  addCC(props) {
    const header = privateHeaderMap4.get(this);
    const cc = new ControlChange(
      {
        controllerType: props.number
      },
      header
    );
    delete props.number;
    Object.assign(cc, props);
    if (!Array.isArray(this.controlChanges[cc.number])) {
      this.controlChanges[cc.number] = [];
    }
    insert(this.controlChanges[cc.number], cc, "ticks");
    return this;
  }
  /**
   * Add a control change to the track.
   */
  addPitchBend(props) {
    const header = privateHeaderMap4.get(this);
    const pb = new PitchBend({}, header);
    Object.assign(pb, props);
    insert(this.pitchBends, pb, "ticks");
    return this;
  }
  /**
   * The end time of the last event in the track.
   */
  get duration() {
    if (!this.notes.length) {
      return 0;
    }
    let maxDuration = this.notes[this.notes.length - 1].time + this.notes[this.notes.length - 1].duration;
    for (let i = 0; i < this.notes.length - 1; i++) {
      const duration = this.notes[i].time + this.notes[i].duration;
      if (maxDuration < duration) {
        maxDuration = duration;
      }
    }
    return maxDuration;
  }
  /**
   * The end time of the last event in the track in ticks.
   */
  get durationTicks() {
    if (!this.notes.length) {
      return 0;
    }
    let maxDuration = this.notes[this.notes.length - 1].ticks + this.notes[this.notes.length - 1].durationTicks;
    for (let i = 0; i < this.notes.length - 1; i++) {
      const duration = this.notes[i].ticks + this.notes[i].durationTicks;
      if (maxDuration < duration) {
        maxDuration = duration;
      }
    }
    return maxDuration;
  }
  /**
   * Assign the JSON values to this track.
   */
  fromJSON(json) {
    this.name = json.name;
    this.channel = json.channel;
    this.instrument = new Instrument(void 0, this);
    this.instrument.fromJSON(json.instrument);
    if (json.endOfTrackTicks !== void 0) {
      this.endOfTrackTicks = json.endOfTrackTicks;
    }
    for (const number in json.controlChanges) {
      if (json.controlChanges[number]) {
        json.controlChanges[number].forEach((cc) => {
          this.addCC({
            number: cc.number,
            ticks: cc.ticks,
            value: cc.value
          });
        });
      }
    }
    json.notes.forEach((n) => {
      this.addNote({
        durationTicks: n.durationTicks,
        midi: n.midi,
        ticks: n.ticks,
        velocity: n.velocity
      });
    });
  }
  /**
   * Convert the track into a JSON format.
   */
  toJSON() {
    const controlChanges = {};
    for (let i = 0; i < 127; i++) {
      if (this.controlChanges.hasOwnProperty(i)) {
        controlChanges[i] = this.controlChanges[i].map(
          (c) => c.toJSON()
        );
      }
    }
    const json = {
      channel: this.channel,
      controlChanges,
      pitchBends: this.pitchBends.map((pb) => pb.toJSON()),
      instrument: this.instrument.toJSON(),
      name: this.name,
      notes: this.notes.map((n) => n.toJSON())
    };
    if (this.endOfTrackTicks !== void 0) {
      json.endOfTrackTicks = this.endOfTrackTicks;
    }
    return json;
  }
};

// node_modules/@tonejs/midi/src/Encode.ts
var import_midi_file = __toESM(require_midi_file());

// node_modules/@tonejs/midi/node_modules/array-flatten/dist.es2015/index.js
function flatten(array) {
  var result = [];
  $flatten(array, result);
  return result;
}
function $flatten(array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (Array.isArray(value)) {
      $flatten(value, result);
    } else {
      result.push(value);
    }
  }
}

// node_modules/@tonejs/midi/src/Encode.ts
function encodeNote(note, channel) {
  return [
    {
      absoluteTime: note.ticks,
      channel,
      deltaTime: 0,
      noteNumber: note.midi,
      type: "noteOn",
      velocity: Math.floor(note.velocity * 127)
    },
    {
      absoluteTime: note.ticks + note.durationTicks,
      channel,
      deltaTime: 0,
      noteNumber: note.midi,
      type: "noteOff",
      velocity: Math.floor(note.noteOffVelocity * 127)
    }
  ];
}
function encodeNotes(track) {
  return flatten(track.notes.map((note) => encodeNote(note, track.channel)));
}
function encodeControlChange(cc, channel) {
  return {
    absoluteTime: cc.ticks,
    channel,
    controllerType: cc.number,
    deltaTime: 0,
    type: "controller",
    value: Math.floor(cc.value * 127)
  };
}
function encodeControlChanges(track) {
  const controlChanges = [];
  for (let i = 0; i < 127; i++) {
    if (track.controlChanges.hasOwnProperty(i)) {
      track.controlChanges[i].forEach((cc) => {
        controlChanges.push(encodeControlChange(cc, track.channel));
      });
    }
  }
  return controlChanges;
}
function encodePitchBend(pb, channel) {
  return {
    absoluteTime: pb.ticks,
    channel,
    deltaTime: 0,
    type: "pitchBend",
    value: pb.value
  };
}
function encodePitchBends(track) {
  const pitchBends = [];
  track.pitchBends.forEach((pb) => {
    pitchBends.push(encodePitchBend(pb, track.channel));
  });
  return pitchBends;
}
function encodeInstrument(track) {
  return {
    absoluteTime: 0,
    channel: track.channel,
    deltaTime: 0,
    programNumber: track.instrument.number,
    type: "programChange"
  };
}
function encodeTrackName(name) {
  return {
    absoluteTime: 0,
    deltaTime: 0,
    meta: true,
    text: name,
    type: "trackName"
  };
}
function encodeTempo(tempo) {
  return {
    absoluteTime: tempo.ticks,
    deltaTime: 0,
    meta: true,
    microsecondsPerBeat: Math.floor(6e7 / tempo.bpm),
    type: "setTempo"
  };
}
function encodeTimeSignature(timeSig) {
  return {
    absoluteTime: timeSig.ticks,
    deltaTime: 0,
    denominator: timeSig.timeSignature[1],
    meta: true,
    metronome: 24,
    numerator: timeSig.timeSignature[0],
    thirtyseconds: 8,
    type: "timeSignature"
  };
}
function encodeKeySignature(keySig) {
  const keyIndex = keySignatureKeys.indexOf(keySig.key);
  return {
    absoluteTime: keySig.ticks,
    deltaTime: 0,
    key: keyIndex + 7,
    meta: true,
    scale: keySig.scale === "major" ? 0 : 1,
    type: "keySignature"
  };
}
function encodeText(textEvent) {
  return {
    absoluteTime: textEvent.ticks,
    deltaTime: 0,
    meta: true,
    text: textEvent.text,
    type: textEvent.type
  };
}
function encode(midi) {
  const midiData = {
    header: {
      format: 1,
      numTracks: midi.tracks.length + 1,
      ticksPerBeat: midi.header.ppq
    },
    tracks: [
      [
        // The name data.
        {
          absoluteTime: 0,
          deltaTime: 0,
          meta: true,
          text: midi.header.name,
          type: "trackName"
        },
        ...midi.header.keySignatures.map((keySig) => encodeKeySignature(keySig)),
        // and all the meta events (cloned for safety)
        ...midi.header.meta.map((e) => encodeText(e)),
        // the first track is all the tempo data
        ...midi.header.tempos.map((tempo) => encodeTempo(tempo)),
        // and the time signature data.
        ...midi.header.timeSignatures.map((timeSig) => encodeTimeSignature(timeSig))
      ],
      // The remaining tracks.
      ...midi.tracks.map((track) => {
        return [
          // Add the name
          encodeTrackName(track.name),
          // the instrument
          encodeInstrument(track),
          // add the notes
          ...encodeNotes(track),
          // and the control changes
          ...encodeControlChanges(track),
          // and the pitch bends.
          ...encodePitchBends(track)
        ];
      })
    ]
  };
  midiData.tracks = midiData.tracks.map((track) => {
    track = track.sort((a, b) => a.absoluteTime - b.absoluteTime);
    let lastTime = 0;
    track.forEach((note) => {
      note.deltaTime = note.absoluteTime - lastTime;
      lastTime = note.absoluteTime;
      delete note.absoluteTime;
    });
    track.push({
      deltaTime: 0,
      meta: true,
      type: "endOfTrack"
    });
    return track;
  });
  return new Uint8Array((0, import_midi_file.writeMidi)(midiData));
}

// node_modules/@tonejs/midi/src/Midi.ts
var Midi = class _Midi {
  /**
   * Download and parse the MIDI file. Returns a promise
   * which resolves to the generated MIDI file.
   * @param url The URL to fetch.
   */
  static async fromUrl(url) {
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return new _Midi(arrayBuffer);
    } else {
      throw new Error(`Could not load '${url}'`);
    }
  }
  /**
   * The header information, includes things like tempo and meta events.
   */
  header;
  /**
   * The midi tracks.
   */
  tracks;
  /**
   * Parse the midi data
   */
  constructor(midiArray) {
    let midiData = null;
    if (midiArray) {
      const midiArrayLike = midiArray instanceof ArrayBuffer ? new Uint8Array(midiArray) : midiArray;
      midiData = (0, import_midi_file2.parseMidi)(midiArrayLike);
      midiData.tracks.forEach((track) => {
        let currentTicks = 0;
        track.forEach((event) => {
          currentTicks += event.deltaTime;
          event.absoluteTime = currentTicks;
        });
      });
      midiData.tracks = splitTracks(midiData.tracks);
    }
    this.header = new Header(midiData);
    this.tracks = [];
    if (midiArray) {
      this.tracks = midiData.tracks.map((trackData) => new Track(trackData, this.header));
      if (midiData.header.format === 1 && this.tracks[0].duration === 0) {
        this.tracks.shift();
      }
    }
  }
  /**
   * The name of the midi file, taken from the first track.
   */
  get name() {
    return this.header.name;
  }
  set name(n) {
    this.header.name = n;
  }
  /**
   * The total length of the file in seconds.
   */
  get duration() {
    const durations = this.tracks.map((t) => t.duration);
    return Math.max(...durations);
  }
  /**
   * The total length of the file in ticks.
   */
  get durationTicks() {
    const durationTicks = this.tracks.map((t) => t.durationTicks);
    return Math.max(...durationTicks);
  }
  /**
   * Add a track to the MIDI file.
   */
  addTrack() {
    const track = new Track(void 0, this.header);
    this.tracks.push(track);
    return track;
  }
  /**
   * Encode the MIDI as a Uint8Array.
   */
  toArray() {
    return encode(this);
  }
  /**
   * Convert the MIDI object to JSON.
   */
  toJSON() {
    return {
      header: this.header.toJSON(),
      tracks: this.tracks.map((track) => track.toJSON())
    };
  }
  /**
   * Parse a JSON representation of the object. Will overwrite the current
   * tracks and header.
   */
  fromJSON(json) {
    this.header = new Header();
    this.header.fromJSON(json.header);
    this.tracks = json.tracks.map((trackJSON) => {
      const track = new Track(void 0, this.header);
      track.fromJSON(trackJSON);
      return track;
    });
  }
  /**
   * Clone the entire object MIDI object.
   */
  clone() {
    const midi = new _Midi();
    midi.fromJSON(this.toJSON());
    return midi;
  }
};
function splitTracks(tracks) {
  const newTracks = [];
  for (let i = 0; i < tracks.length; i++) {
    const defaultTrack = newTracks.length;
    const trackMap = /* @__PURE__ */ new Map();
    const currentProgram = Array(16).fill(0);
    for (const event of tracks[i]) {
      let targetTrack = defaultTrack;
      const channel = event.channel;
      if (channel !== void 0) {
        if (event.type === "programChange") {
          currentProgram[channel] = event.programNumber;
        }
        const program = currentProgram[channel];
        const trackKey = `${program} ${channel}`;
        if (trackMap.has(trackKey)) {
          targetTrack = trackMap.get(trackKey);
        } else {
          targetTrack = defaultTrack + trackMap.size;
          trackMap.set(trackKey, targetTrack);
        }
      }
      if (!newTracks[targetTrack]) {
        newTracks.push([]);
      }
      newTracks[targetTrack].push(event);
    }
  }
  return newTracks;
}
export {
  Header,
  Midi,
  Track
};
