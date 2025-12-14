// Lightweight logger used across server for consistent logs
const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

module.exports = {
  info: (msg, meta) => console.log(format('info', msg, meta)),
  warn: (msg, meta) => console.warn(format('warn', msg, meta)),
  error: (msg, meta) => console.error(format('error', msg, meta)),
  debug: (msg, meta) => console.debug ? console.debug(format('debug', msg, meta)) : console.log(format('debug', msg, meta))
};
