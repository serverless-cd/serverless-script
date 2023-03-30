require('@serverless-cd/config'); // 注入.env文件配置到当前环境
const Deploy = require('./deploy');
const Start = require('./start');

module.exports = {
  Deploy,
  Start,
  generate: () => {},
};
