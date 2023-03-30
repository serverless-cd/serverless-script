const { help } = require("@serverless-devs/core");
const { spawnSync } = require('child_process');
const Deploy = require('./deploy');

class Start extends Deploy {
  async start() {
    if (this.isHelp) {
      help(require('./help/start'));
      return;
    }

    await super.run();

    spawnSync(`DEBUG=serverless-cd:* npx nodemon index.js --ignore __tests__`, {
      encoding: 'utf8',
      shell: true,
      stdio: 'inherit',
    });
  }
}

module.exports = Start;
