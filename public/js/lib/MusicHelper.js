export default class MusicHelper {
  static bpmToTempo(bpm) {
    return Math.round((60 * 1000000) / bpm);
  }

  static tick2second(tick, ticksPerBeat, tempo) {
    const scale = (tempo * 0.000001) / ticksPerBeat;
    return tick * scale;
  }

  static time2IntervalTime(time, startTime, intervalDuration) {
    const elapsed = time - startTime;
    return elapsed % intervalDuration;
  }
}
