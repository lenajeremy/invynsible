// import { spawn } from "child_process";
const {spawn} = require('child_process');

function cmd(command, options) {
  let p = spawn(command[0], command.slice(1), options);
  return new Promise((resolveFunc, reject) => {
    p.stdout.on("data", (x) => {
      process.stdout.write(x.toString());
    });
    p.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    p.on("exit", (code) => {
      if (code === 0) resolveFunc(code);
      else reject(code);
    });
  });
}

module.exports = cmd;
// export default cmd;
