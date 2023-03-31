const { fs } = require('@serverless-cd/core');
const path = require('path');
const { spawnSync } = require('child_process');
const debug = require('debug')('serverless-cd:script_initialize');

const { getPrismaType, getAdminRootPath } = require('./util');

class Initialize {
  /**
   * 
   * @param {PrismaClient} prismaClient 
   */
  constructor(prismaClient) {
    if (!prismaClient) {
      const { PrismaClient } = require('@prisma/client');
      prismaClient = new PrismaClient();
    }
    this.prisma = prismaClient;
  }
  async init() {
    // 链接成功，直接跳出
    if (await this.testConnection()) {
      return;
    }
    // 获取 prisma 类型
    const provider = getPrismaType();
    debug(`provider 类型是 ${provider}`);

    if (provider === 'sqlite') {
      await this.sqlite();
    } else if (provider === 'mysql') {
      await this.mysql();
    } else if (provider === 'mongodb') {
      await this.mongodb();
    }

    // 重新链接数据库，否则访问一直会失败
    await this.prisma.$disconnect();
    await this.prisma.$connect();
    if (!(await this.testConnection())) {
      console.error('没有链接上数据表, 尝试启动');
    }
  }

  async testConnection() {
    // 判断数据表是否已经存在
    try {
      await this.prisma.user.findUnique({ where: { id: '2' } });
      debug('测试链接成功');
      return true;
    } catch (ex) {
      debug(`测试链接失败，code: ${ex.code}`);
      return ex.code && ex.code !== 'P2021';
    }
  }

  async sqlite() {
    const databaseUrl = process.env.DATABASE_URL;
    const targetPath = databaseUrl.replace('file:', '');
    const sourceAddress = path.join(getAdminRootPath(), 'prisma', 'dev.db');
    debug(`需要将 sqlite copy 一份到临时目录: 临时缓存文件 ${targetPath} 初始仓库 ${sourceAddress}`);

    fs.ensureDirSync(path.dirname(targetPath));
    try {
      await fs.remove(targetPath);
    } catch (ex) { }
    try {
      await fs.copy(sourceAddress, targetPath);
    } catch (ex) {
      throw new Error(`复制 prisma/dev.db 失败，错误信息：${ex}\n请查看 xxx 文档修复项目`);
    }
  }

  async mysql() {
    try {
      spawnSync(`npx prisma migrate dev --name init`, {
        encoding: 'utf8',
        stdio: 'inherit',
        shell: true,
      });
    } catch (ex) {
      throw new Error('链接不上数据库，请查看xxx文档');
    }
  }

  async mongodb() {
    debug('思路：链接远程数据库，然后使用 db 语法创建命名空间');
    console.error('为支持初始化');
  }
}

module.exports = Initialize;
