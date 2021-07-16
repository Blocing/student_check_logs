const { getConn } = require("../../../config/pool");
const { send } = require("../../../sdk/sdk");

require("dotenv").config();

const cardService = {
  fetchStudentIdCardWithHolderId: async (holder_id) => {
    let data = {};
    let isOk = false;
    // 블록체인 원장으로 조회
    try {
      conn = await getConn();
      const [
        [idCard],
      ] = await conn.query("SELECT * FROM StudentIdCard WHERE holder_id = ?", [
        holder_id,
      ]);
      const args = [idCard.card_did];
      console.log(
        "===========블록체인 원장에 학생증 조회 (setCard)==========="
      );
      const result = await send(0, "getCard", args);
      // 블록체인 원장 학생이 가지고있는 did가 같으면 조회완료
      console.log(result);
      if (result.card_did == idCard.card_did) {
        console.log("조회성공");
        isOk = true;
        const [
          [information],
        ] = await conn.query("SELECT * FROM Holder WHERE id = ?", [holder_id]);
        console.log(information);

        data.name = information.name;
        data.studentId = information.student_id;
        data.university = information.university;
        data.department = information.department;
        data.expireDate = idCard.expire_date;
        data.holder_id = idCard.holder_id;
        data.status = idCard.status;
        return data;
      } else return "FAIL";
      // update_date로 사용가능한지 파악하는 거만들기
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },

  getExpireDate: async (today) => {},
};

module.exports = cardService;
