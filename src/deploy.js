const path = require("path");
const { lodash: _, help, fse, ParseVariable, getCredential } = require("@serverless-devs/core");
const { spawnSync } = require('child_process');
const debug = require('debug')('serverless-cd:script_start');
const Initialize = require('./initialize');
const generate = require('./generate');
const { getAdminRootPath, getPrismaType } = require('./util');

class Deploy {
  /**
   * 启动项目
   * @param {{ yaml: String; help: Boolean; 'file-path'?: String }} params 
   */
  constructor(params) {
    debug(`启动配置: ${JSON.stringify(params)}`);
    const isHelp = _.get(params, 'help') || _.get(params, 'h');
    this.isHelp = isHelp;
    if (isHelp) {
      return;
    }

    this.generate = _.get(params, 'generate', false);
    this.yaml = _.get(params, 'yaml', 's.yaml');
    this.filePath = _.get(params, 'file-path') || _.get(params, 'filePath') || getAdminRootPath();
    debug('查找启动 yaml 的地址');
    const yamlPath = path.join(this.filePath, this.yaml);
    debug(`最终需要解析的yaml 地址是: ${yamlPath}`);

    if (!fse.existsSync(yamlPath)) {
      throw new Error(`${yamlPath} 文件不存在`);
    }
    if (!fse.statSync(yamlPath).isFile()) {
      throw new Error(`${yamlPath} 不是文件`);
    }
    this.yamlPath = yamlPath;
  }

  async run() {
    if (this.isHelp) {
      help(require('./help/start'));
      return;
    }

    debug('解析 yaml');
    const parsedResult = await this.parseYaml();
    debug('将 yaml 配置注入到当前环境');
    await this.injectionEnv(parsedResult);

    debug('初始化数据库相关');
    const provider = getPrismaType();
    debug(`运行的 provider 数据库类型: ${provider}`);
    await this.initialize(provider);
  }

  // 解析 yaml
  async parseYaml() {
    try {
      const parse = new ParseVariable(this.yamlPath);
      debug('第一次解析');
      const parsedResult = await parse.init();
      debug('第二次解析 兼容vars下的魔法变量，需再次解析');
      return await parse.init(parsedResult.realVariables);
    } catch (ex) {
      debug(ex);
      throw new Error(`\n解析文件${this.yamlPath}失败`);
    }
  }

  // 将 yaml 配置注入到当前环境
  async injectionEnv(parsedResult) {
    const env = _.get(
      parsedResult,
      'realVariables.services.admin.props.function.environmentVariables',
      {},
    );
    const region = _.get(parsedResult, 'realVariables.services.admin.props.region', '');
    const serviceName = _.get(parsedResult, 'realVariables.services.admin.props.service.name', '');
    _.merge(process.env, env);
    _.set(process.env, 'REGION', region);
    _.set(process.env, 'SERVICE_NAME', serviceName);
  
    // 获取密钥配置
    const ACCOUNT_ID = process.env.ACCOUNT_ID || process.env.FC_ACCOUNT_ID;
    if (_.isEmpty(ACCOUNT_ID)) {
      const access = _.get(parsedResult, 'realVariables.access', '');
      const { SecurityToken, AccountID, AccessKeyID, AccessKeySecret } = await getCredential(
        access,
      );
      const cred = {
        ACCOUNT_ID: AccountID,
        ACCESS_KEY_ID: AccessKeyID,
        ACCESS_KEY_SECRET: AccessKeySecret,
      };
      if (SecurityToken) {
        _.set(cred, 'SECURITY_TOKEN', SecurityToken);
      }
      _.merge(process.env, cred);
    }
  }

  // 初始化数据库相关
  async initialize(provider) {
    const { DATABASE_URL: databaseUrl = '' } = process.env;
    if (_.isEmpty(databaseUrl) || _.startsWith(databaseUrl, '${')) {
      throw new Error(`请先设置环境变量 DATABASE_URL 用于链接 ${provider} 数据库`);
    }
    if (_.isEmpty(provider)) {
      console.warn('没有检测到 prisma 配置，跳过初始化');
      return;
    }

    if (provider === 'sqlite') {
      if (!_.startsWith(databaseUrl, 'file:')) {
        throw new Error(`sqlite 启动 DATABASE_URL 需要 file: 开头`);
      }

      let filePath = databaseUrl.replace('file:', '').replace('/mnt/auto', './.tmp');
      if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
        process.env.DATABASE_URL = `file:${filePath}`;
      }
      console.info('sqlite 的 DATABASE_URL 配置最终为: ' + process.env.DATABASE_URL);
    } else if (provider === 'mysql') {
      if (!_.startsWith(databaseUrl, 'mysql:')) {
        throw new Error('mysql 启动 DATABASE_URL 需要 mysql: 开头');
      }
    } else if (provider === 'mongodb') {
      if (!_.startsWith(databaseUrl, 'mongodb:')) {
        throw new Error('mongodb 启动 DATABASE_URL 需要 mongodb: 开头');
      }
    } else {
      console.error(`启动暂未支持${provider}数据库，启动可能失败`);
      return;
    }

    const schemaFile = path.join(getAdminRootPath(), 'prisma', 'schema.prisma');
    if (this.generate || !fse.existsSync(schemaFile)) {
      await generate({ provider });
    } else {
      debug('检测存在 schema.prisma 文件，跳过生成 prisma 过程');
    }

    spawnSync(`npx prisma generate`, {
      encoding: 'utf8',
      shell: true,
      stdio: 'inherit',
    });
    const initialize = new Initialize();
    await initialize.init();
  }
}

module.exports = Deploy;
