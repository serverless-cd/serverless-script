
const getPrismaType = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 未配置');
  }
  if (databaseUrl.startsWith('file:')) {
    return 'sqlite';
  }
  if (databaseUrl.startsWith('mysql:')) {
    return 'mysql';
  }
  if (databaseUrl.startsWith('mongodb:')) {
    return 'mongodb';
  }
  throw new Error('DATABASE_URL 配置不符合预期或者此数据库还没有支持');
}

const getAdminRootPath = () => process.cwd();

module.exports = {
  getPrismaType,
  getAdminRootPath,
};