require("@serverless-cd/config");
const core = require("@serverless-devs/core");
const path = require("path");
const _ = core.lodash;
const fs = core.fse;
const { RUN_TYPE = "" } = process.env;

const getYamlPath = (yamlName) => {
  let sPath = path.join(process.cwd(), yamlName);
  if (fs.existsSync(sPath)) {
    return sPath;
  }
  sPath = path.join(process.cwd(), "..", yamlName);
  if (fs.existsSync(sPath)) {
    return sPath;
  }
};

const getYaml = () => {
  let sPath;
  if (RUN_TYPE.endsWith(".yaml") || RUN_TYPE.endsWith(".yml")) {
    sPath = getYamlPath(RUN_TYPE);
  } else {
    sPath = getYamlPath("s.yaml");
    if (!sPath) {
      sPath = getYamlPath("s.yml");
    }
  }
  if (!sPath) {
    console.warn("没有找到 yaml 文件");
  }
  return sPath;
};

const parseYaml = async (sPath) => {
  const parse = new core.ParseVariable(sPath);
  // 第一次解析
  let parsedObj = await parse.init();
  // 第二次解析 兼容vars下的魔法变量，需再次解析
  parsedObj = await parse.init(parsedObj.realVariables);
  const env = _.get(
    parsedObj,
    "realVariables.services.admin.props.function.environmentVariables",
    {}
  );
  _.merge(process.env, env);
  const region = _.get(
    parsedObj,
    "realVariables.services.admin.props.region",
    ""
  );
  const serviceName = _.get(
    parsedObj,
    "realVariables.services.admin.props.service.name",
    ""
  );
  _.set(process.env, "REGION", region);
  _.set(process.env, "SERVICE_NAME", serviceName);

  // webhook 提醒
  if (_.get(process.env, "WEBHOOK_URL")) {
    console.log("需要设置环境变量 WEBHOOK_URL，否则可能会影响应用创建");
  }

  // 获取密钥配置
  const ACCOUNT_ID = process.env.ACCOUNT_ID || process.env.FC_ACCOUNT_ID;
  if (_.isEmpty(ACCOUNT_ID)) {
    const access = _.get(parsedObj, "realVariables.access", "");
    const { SecurityToken, AccountID, AccessKeyID, AccessKeySecret } =
      await core.getCredential(access);
    const cred = {
      ACCOUNT_ID: AccountID,
      ACCESS_KEY_ID: AccessKeyID,
      ACCESS_KEY_SECRET: AccessKeySecret,
    };
    if (SecurityToken) {
      _.set(cred, "SECURITY_TOKEN", SecurityToken);
    }
    _.merge(process.env, cred);
  }

  return parsedObj;
};

module.exports = {
  getYaml,
  parseYaml,
};
