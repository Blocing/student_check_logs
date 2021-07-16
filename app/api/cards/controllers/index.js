const { fetchStudentIdCardWithHolderId } = require("../services");
const { getExpireDate } = require("../../users/services");
const cardController = {
  StudentIdCard: async (req, res, next) => {
    const { holder_id } = req.params;
    const result = await fetchStudentIdCardWithHolderId(holder_id);
    res.status(200).json(result);
  },

  putExpireDate: async (req, res, next) => {
    const { holder_id } = req.params;
    const expireDate = getExpireDate(new Date());
    const result = await activateStudentIdCardWithHolderId(holder_id);
      //TODO: 재발급이니 만료기간 갱신시키기
  },
};

module.exports = cardController;
