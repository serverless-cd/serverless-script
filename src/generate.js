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
  const templateFile = path.join(getAdminRootPath(), 'prisma', 'db.prisma.art');
  debug(`模版文件地址: ${templateFile}`);
  if (!fs.existsSync(templateFile)) {
    throw new Error(`模版文件不存在: ${templateFile}`);
  }

  const payload = template(templateFile, { provider });
  const targetFile = path.join(getAdminRootPath(), 'prisma', 'schema.prisma');
  debug(`输出prisma文件地址: ${targetFile}`);
  fs.outputFileSync(targetFile, payload);
}

module.exports = generate;
