// Status only: never print the user's notes or generated text here.
export function log(message) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  process.stderr.write(`[${time}] ${message}\n`);
}
