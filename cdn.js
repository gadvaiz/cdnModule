const State = require("./state");
const dotenv = require("dotenv");
const axios = require("axios");

// get access to config file - config.env in case there is one
dotenv.config({ path: "./config.env" });

// init cdnList from env variable
const cdnList = process.env.CDN_SERVERS.split(",");
// init cdn_org from env variable
const cdn_org = process.env.CDN_ORG;
//create state to track on server that was unreachable, manage cdn - removeDuplicate(by storing in a Map).
const state = new State(cdnList);

//implement Promise.any
const reverse = (p) => {
  return new Promise((resolve, reject) => {
    Promise.resolve(p).then(reject, resolve);
  });
};
// promise.all define to exit on any reject - because of reverse: rsolve means reject. and then reserve activate resolve.
const any = (arr) => {
  return reverse(Promise.all(arr.map(reverse)));
};

// check if cdn/url is available.
const isAvailable = async (cdn) => {
  try {
    let res = await axios({
      method: "GET",
      url: `${cdn}/stat`,
      validateStatus: () => true,
    });
    if (res.status === 200) return cdn;
    return Promise.reject();
  } catch (err) {
    state.markUnaccessible(cdn);
    return Promise.reject();
  }
};

// check if the server is available, if not -mark it as unaccesible(if it happends twice -cdn will deleted from the state).
const isUrlAvailable = async (cdn, relativeUrl) => {
  try {
    let result = await axios({
      method: "GET",
      url: `${cdn}${relativeUrl}`,
      validateStatus: () => true,
    });
    if (result.status === 200) return true;
    return false;
  } catch (err) {
    return false;
  }
};

// make a list of promises with request to the server.
const getPromises = (cdnList) => {
  return cdnList.map((cdn) => {
    let res = isAvailable(cdn);
    return res;
  });
};

// create request for all servers at once. the first to response is the faster one.
const getFastestCDN = async (cdnList) => {
  try {
    return await any(getPromises(cdnList));
  } catch (err) {
    return Promise.reject();
  }
};

//remove cdn fron the list in case content for the url not found
const removeCDN = (cdnList, cdn) => {
  cdnList.splice(cdnList.indexOf(cdn), 1);
};

// in case that found the fastest cdn. return function to fetch data from this server.
const fetchCDN = (cdn) => {
  return async (relativeUrl) => {
    try {
      if (await isUrlAvailable(cdn, relativeUrl)) {
        return await axios({
          metod: "GET",
          urlh: `${cdn}${relativeUrl}`,
          validateStatus: () => true,
        });
      } else {
        let cdnList = state.getCDNList();
        while (cdnList.length > 0 && cdn) {
          removeCDN(cdnList, cdn);
          cdn = await getFastestCDN(cdnList);
          if (await isUrlAvailable(cdn, relativeUrl))
            return await axios({
              method: "GET",
              url: `${cdn}${relativeUrl}`,
              validateStatus: () => true,
            });
        }
        return await axios({
          method: "GET",
          url: `${cdn_org}${relativeUrl}`,
          validateStatus: () => true,
        });
      }
    } catch (err) {
      return await fetchCDNOrg(relativeUrl);
    }
  };
};

//function to fetch from cdn_org
fetchCDNOrg = async (relativeUrl) => {
  // fetch cdn_org
  try {
    const res = await axios({
      method: "GET",
      url: `${cdn_org}${relativeUrl}`,
      validateStatus: () => true,
    });
    if (res.status === 200) return res;
    return {
      statuscode: res.status,
      status: "fail",
      message: `url: ${relativeUrl} dont exists on the servers`,
    };
  } catch (err) {
    //in case of cdn_org not contain the content for the url.
    return {
      statuscode: 404,
      status: "fail",
      message: `url: ${relativeUrl} dont exists on the servers`,
    };
  }
};

// export select function.
module.exports = async () => {
  try {
    /* get the fastest cdn name.
  all requests sent at once. the first promise that get resolved is from the fastest cdn.*/
    let cdn = await getFastestCDN(state.getCDNList());
    // return function to handle url.
    return fetchCDN(cdn);
  } catch (err) {
    // because all requests was rejected - return function that choose the cdn_org.
    return fetchCDNOrg;
  }
};
