// ANSI color helpers for terminal logs

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';

const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const white = '\x1b[37m';
const gray = '\x1b[90m';

const bgRed = '\x1b[41m';
const bgGreen = '\x1b[42m';
const bgYellow = '\x1b[43m';
const bgBlue = '\x1b[44m';
const bgMagenta = '\x1b[45m';
const bgCyan = '\x1b[46m';

export const c = {
  // Text colors
  red: (s: string) => `${red}${s}${reset}`,
  green: (s: string) => `${green}${s}${reset}`,
  yellow: (s: string) => `${yellow}${s}${reset}`,
  blue: (s: string) => `${blue}${s}${reset}`,
  magenta: (s: string) => `${magenta}${s}${reset}`,
  cyan: (s: string) => `${cyan}${s}${reset}`,
  white: (s: string) => `${white}${s}${reset}`,
  gray: (s: string) => `${gray}${s}${reset}`,

  // Bold colors
  boldRed: (s: string) => `${bold}${red}${s}${reset}`,
  boldGreen: (s: string) => `${bold}${green}${s}${reset}`,
  boldYellow: (s: string) => `${bold}${yellow}${s}${reset}`,
  boldBlue: (s: string) => `${bold}${blue}${s}${reset}`,
  boldMagenta: (s: string) => `${bold}${magenta}${s}${reset}`,
  boldCyan: (s: string) => `${bold}${cyan}${s}${reset}`,
  boldWhite: (s: string) => `${bold}${white}${s}${reset}`,

  // Styles
  bold: (s: string) => `${bold}${s}${reset}`,
  dim: (s: string) => `${dim}${s}${reset}`,

  // Badge-style (bg + white text)
  bgRed: (s: string) => `${bgRed}${bold}${white} ${s} ${reset}`,
  bgGreen: (s: string) => `${bgGreen}${bold}${white} ${s} ${reset}`,
  bgYellow: (s: string) => `${bgYellow}${bold}${white} ${s} ${reset}`,
  bgBlue: (s: string) => `${bgBlue}${bold}${white} ${s} ${reset}`,
  bgMagenta: (s: string) => `${bgMagenta}${bold}${white} ${s} ${reset}`,
  bgCyan: (s: string) => `${bgCyan}${bold}${white} ${s} ${reset}`,

  // Semantic
  ok: (s: string) => `${green}${bold}${s}${reset}`,
  err: (s: string) => `${red}${bold}${s}${reset}`,
  warn: (s: string) => `${yellow}${bold}${s}${reset}`,
  info: (s: string) => `${cyan}${s}${reset}`,
  label: (s: string) => `${magenta}${bold}${s}${reset}`,
  val: (s: string) => `${white}${bold}${s}${reset}`,
  time: (s: string) => `${yellow}${s}${reset}`,
};
