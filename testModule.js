const { select } = require("./cdn");

const Working = async () => {
  const start = Date.now();

  const serve = await select();

  let res = await serve("");
  console.log(res.status);
  console.log(Date.now() - start);
};

Working();
