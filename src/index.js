require('@serverless-cd/config'); // 注入.env文件配置到当前环境
const Setup = require('./setup');
const Start = require('./start');
const generate = require('./generate');
const Initialize = require('./initialize');

module.exports = {
  Setup,
  Start,
  Initialize,
  generate,
};
