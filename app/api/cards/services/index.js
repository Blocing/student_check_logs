const { getConn } = require("../../../config/pool");
const { send } = require("../../../sdk/sdk");
const moment = require("moment");

require("dotenv").config();

const cardService = {

  checkValid: (today, expired_date) => {
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let date = today.getDate();
    let hour = today.getHours();
    let minute = today.getMinutes();
    let second = today.getSeconds();
    
    if(moment(year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second).isBefore(expired_date)) {
	return true;
    }
    else{
	return false;
    }
  },

  getStudentIdCardWithDid: async (did) => {
    const args = [did];
    const result = await send(0, "getCard", args);
    return result;
  },

  fetchStudentIdCardWithHolderId: async (holder_id) => {
    let conn;
    let data = {};
    let isOk = false;
    // 블록체인 원장으로 조회
    try {
      conn = await getConn();
      let [[idCard],] = await conn.query("SELECT * FROM StudentIdCard WHERE holder_id = ?", [holder_id,]);
      const args = [idCard.card_did];
      const result = await send(0, "getCard", args);
      
	
	    
	    // 블록체인 원장 학생이 가지고있는 did가 같으면 조회완료
      if (result.card_did == idCard.card_did) {
        let [
          [information],
        ] = await conn.query("SELECT * FROM Holder WHERE id = ?", [holder_id]);

// 유효한지 파악하기
	let temp = new Date();
	const utc = temp.getTime() + (temp.getTimezoneOffset() * 60 * 1000);
	const KR_TIME_DIFF= 9 * 60 * 60 * 1000;
	const today = new Date(utc + (KR_TIME_DIFF));
	
	const status = "EXPIRED";
	if(cardService.checkValid(today, idCard.expire_date) === false) {
	    await conn.execute("UPDATE StudentIdCard SET status = ? WHERE card_did = ?", [status, result.card_did]);
	}
	
	[[idCard],] = await conn.query("SELECT * FROM StudentIdCard WHERE holder_id = ?", [holder_id,]);

        data.name = information.name;
        data.studentId = information.student_id;
        data.university = information.university;
        data.department = information.department;
        data.expireDate = idCard.expire_date;
        data.holder_id = idCard.holder_id;
        data.status = idCard.status;
        return data;
      } else return "FAIL";
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  
  activateStudentIdCardWithHolderId: async (holder_id, expireDate) => {
    let conn;
    try {
      conn = await getConn();
      const [[idCard],] = await conn.query("SELECT * FROM StudentIdCard WHERE holder_id = ?", [holder_id]);
      
      const newData = { card_did : idCard.card_did, holder_id : idCard.holder_id, expire_date : expireDate, status: "ACTIVATED" };
     
      await conn.execute("UPDATE StudentIdCard SET expire_date = ?, status = ? WHERE holder_id = ?", [newData.expire_date, newData.status, newData.holder_id]);
     
      let args = [newData.card_did, newData.expire_date];
      const result = await send(1, "updateCard", args);

      const [[row]] = await conn.query("SELECT name, student_id, university, department, expire_date, holder_id, status FROM bloc.StudentIdCard, bloc.Holder WHERE bloc.Holder.id = bloc.StudentIdCard.holder_id");
      let data = {};
      data.name = row.name;
      data.studentId = row.student_id;
      data.university = row.university;
      data.department = row.department;
      data.expireDate = row.expire_date;
      data.holder_id = row.holder_id;
      data.status = row.status;
      return data;
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
    
  }
};

module.exports = cardService;
