const { select } = require("./cdn");

const Working = async () => {
  try {
    let serve = await select();

    let res = await serve("/questionsimuck-size-exceeded");
    //console.log(res);
  } catch (err) {
    console.log("err");
  }
};

//test the module.
Working();
