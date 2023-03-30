module.exports = [
  {
    header: 'start',
    content: '本地启动',
  },
  {
    header: '参数',
    optionList: [
      {
        name: 'yaml',
        description: '[必填] 指定启动 yaml 的名称，默认: s.yaml',
        type: String,
      },
      {
        name: 'file-path',
        description: '[选填] 指定 yaml 目录, 默认是 cwd 路径',
        type: String,
      },
    ],
  }
]