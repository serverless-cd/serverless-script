const template = require("art-template");
const { fs } = require("@serverless-cd/core");
const { help: showHelp } = require("@serverless-devs/core");
const path = require("path");
const debug = require('debug')('serverless-cd:script_generate');
const { getPrismaType, getAdminRootPath } = require("./util");

async function generate({ provider, help, h } = {}) {
  if (help || h) {
    showHelp(require('./help/generate'));
    return;
  }
  if (!provider) {
    provider = getPrismaType();
  }
  const templateYaml = path.join(getAdminRootPath(), 'prisma', 'db.prisma.art');
  debug(`模版文件地址: ${templateYaml}`);
  if (!fs.existsSync(templateYaml)) {
    throw new Error(`模版文件不存在: ${templateYaml}`);
  }

  const payload = template(templateYaml, { provider });
  const targetYaml = path.join(getAdminRootPath(), 'prisma', 'schema.prisma');
  debug(`输出prisma文件地址: ${targetYaml}`);
  fs.outputFileSync(targetYaml, payload);
}

module.exports = generate;
