const { getStudentIdCardWithDid, fetchStudentIdCardWithHolderId, activateStudentIdCardWithHolderId } = require("../services");
const { getExpireDate } = require("../../users/services");
const cardController = {
  StudentIdCard: async (req, res, next) => {
    const { holder_id } = req.params;
    const result = await fetchStudentIdCardWithHolderId(holder_id);
    res.status(200).json(result);
  },

  getStudent: async (req, res, next) => {
    const { did } = req.params;
    const result = await getStudentIdCardWithDid(did);
    res.status(200).json(result);
  },

  putExpireDate: async (req, res, next) => {
    const { holder_id } = req.params;
    let now = new Date();
    const expireDate = getExpireDate(new Date((now.getTime() + (now.getTimezoneOffset()*60*1000)) + (9*60*60*1000)));
    const result = await activateStudentIdCardWithHolderId(holder_id, expireDate);
    res.status(201).json(result);
  },
};

module.exports = cardController;
