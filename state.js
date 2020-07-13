module.exports = class {
  constructor(cdnList) {
    this.cdnList = new Map();
    // init the  list with cdn as a key and count of unaccessible to 0
    cdnList.forEach((el) => this.cdnList.set(el, 0));
  }

  getCDNList() {
    return [...this.cdnList.keys()];
  }
  printList() {
    console.log(this.cdnList);
  }
  markUnaccessible(cdn) {
    this.cdnList.get(cdn) === 1
      ? this.cdnList.delete(cdn)
      : this.cdnList.set(cdn, 1);
  }
};
