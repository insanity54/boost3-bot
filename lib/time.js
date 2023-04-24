
// greets chatGPT
export function formatDuration(duration) {
  var milliseconds = parseInt((duration % 1000));
  var seconds = Math.floor((duration / 1000) % 60);
  var minutes = Math.floor((duration / (1000 * 60)));

  var parts = [];
  if (minutes > 0) {
    parts.push(minutes + "m");
  }
  if (seconds > 0 || (minutes == 0 && duration == 0)) {
    parts.push(seconds + "s");
  }
  if (milliseconds > 0 && duration < 1000) {
    parts.push(milliseconds + "ms");
  }

  return parts.join(" ");
}
