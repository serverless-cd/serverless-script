const core = require("@serverless-devs/core");
const path = require("path");
const { spawnSync } = require("child_process");
const _ = core.lodash;
const { getYaml, parseYaml } = require("./util");

/**
 * local start
 */
module.exports = async function start() {
  const sPath = getYaml();
  console.debug(`获取到 s yaml 路径: ${sPath}`);
  if (sPath) {
    const parsedObj = await parseYaml(sPath);
    const prisma = _.get(parsedObj, "realVariables.vars.prisma", "");
    console.debug(`运行的 prisma 数据库类型: ${prisma}`);

    const { DATABASE_URL: databaseUrl = "" } = process.env;
    if (databaseUrl.startsWith("${env.") || !databaseUrl) {
      throw new Error(
        `请先设置环境变量 DATABASE_URL 用于链接 ${prisma} 数据库`
      );
    }
    if (databaseUrl.startsWith("file:")) {
      let filePath = databaseUrl.replace("file:", "").replace("/mnt/auto", ".");
      if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
        process.env.DATABASE_URL = `file:${filePath}`;
      }
    }

    if (prisma) {
      spawnSync(`npx prisma generate --schema=./prisma/${prisma}.prisma`, {
        encoding: "utf8",
        shell: true,
        stdio: "inherit",
      });
      await require("./services/init.service")(prisma);
    }
  }
  console.debug(`初始化结束`);

  if (process.env.RUN_TYPE !== "deploy") {
    spawnSync("DEBUG=serverless-cd:* nodemon index.js", {
      encoding: "utf8",
      shell: true,
      stdio: "inherit",
    });
  }
}

