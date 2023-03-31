module.exports = [
  {
    header: 'generate',
    content: '根据参数或者环境变量生成 prisma 文件',
  },
  {
    header: '参数',
    optionList: [
      {
        name: 'provider',
        description: '[选填] 数据库供应商，默认通过解析环境变量"DATABASE_URL"生成',
        type: String,
      },
    ],
  }
]