
## 启动场景

### 场景一、 s init 的项目

```shell
cd admin
npm install
npm run start
```

### 场景二、 贡献代码启动

```shell
make install
make ${db_type}-start
```

> 如果是 sqlite 可能需要手动清除一下 admin 目录下的 .tmp 目录


## 启动实现


### 部署准备

1. 注入 .env 文件的环境变量

2. 查找启动 yaml 的地址 【主要是为了注入yaml配置环境到本地环境，为了初始化 db 、生成客户端等: 需要两个参数，标注启动 yaml 的地址(`--file-path` 默认 cwd)和名称(`--yaml` 默认 s.yaml)

3. 解析 yaml。密钥如果配置为变量形式（`access: '{{access}}'`）存在交互问题，**不能**使用`--access/-a`指定密钥，因为启动脚本获取不到启动s的入参数。
- 解决方式一：可以使用环境变量的形式配置yaml，比如：通过写在和**yaml同级**的`.env`文件内,内容为`default_serverless_devs_access={"AccountID": 11111111,"AccessKeyID": "xxxxxxxxx","AccessKeySecret": "xxxxxxxx"}`, 然后yaml中的 access 配置 default_serverless_devs_access
- 解决方式二：在 env 中配置密钥信息，环境变量键值 ACCOUNT_ID、ACCESS_KEY_ID、ACCESS_KEY_SECRET 

4. 将 yaml 配置注入到当前环境

5. 当前环境根据当前环境做一些初始化动作
    - prisma： **TODO** <根据 prisma 生成文件 src/generate.js>
    - sqlite: `file:/mnt/auto/` 转化为 `file:./.tmp/`, 建议不要放在 src/admin/prisma，在线上会有一个 copy 这个文件的动作，可能会导致存在一些问题。启动逻辑：尝试链接数据库，如果链接上则直接使用，如果链接不上则复制 src/admin/prisma/dev.db 到配置目录
    - 抛出一个方法 initialieze，给线上运行的初始钩子调用。**TODO**: 需要 ignore core包

### 本地启动

前面和部署流程一致，仅需要新增一个启动文件的步骤 `DEBUG=serverless-cd:* npx nodemon index.js --ignore __tests__`

