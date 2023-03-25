const template = require("art-template");
const path = require("path");

module.exports = () => {
  let path = path.join(process.cwd(), "prisma", "db.prisma.art");
  const html = template(path, {
    provider: "mongodb",
  });
  console.log(html);
};
