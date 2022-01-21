const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const Base58 = require("base-58");
const { getConn } = require("../../../config/pool");
const { send } = require("../../../sdk/sdk");
const { sendVerificationSMS } = require("../../../utils/sms.util");

require("dotenv").config();

const getAuthCode = (size) => {
  let num = "";
  for (let i = 0; i < size; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num.toString();
};

const createDID = () => {
  const id = uuidv4();
  let did = "did:sov:";
  const code = Base58.encode(Buffer.from(id, "base64"));
  return did + code;
};

const getExpireDate = (today) => {
  let year = today.getFullYear(); // ? ?Žˆï¿½ëŒ?˜™?Œ·ï¿?
  let month = today.getMonth() + 1; // ? ?ŽŒ?œž
  let date = today.getDate(); // ? ?Ž„?…Šç­Œìš‘?˜™
  let hour = today.getHours(); // ? ?ŽŒ?’„? ?ŽŒëµ?
  let minute = today.getMinutes();
  let second = today.getSeconds();
  const thisFirstSemester = moment(year + "-03-01 23:59:59","YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  const thisSecondSemester = moment(year + "-09-01 23:59:59","YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  const nextFirstSemester = moment((1 + year) + "-03-01 23:59:59","YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  if (moment(year + "-" + month + "-" + date).isBefore(year + "-03-01")) {
    return thisFirstSemester;
  } 
  else if (moment(year + "-" + month + "-" + date).isBefore(year + "-09-01")) {
    return thisSecondSemester;
  }
  else {
    return nextFirstSemester;
  }
};

const userService = {
  
  sendSMS: async (phoneNumber) => {
    let number = "+82" + phoneNumber.substr(1, 10);
    const authCode = getAuthCode(6);
    sendVerificationSMS(number, authCode);
    return authCode;
  },
  getHolder: async({name, studentId, university, department}) => {
	let conn;
	try {
		conn = await getConn();
		const [[rows]] = await conn.query("SELECT * FROM Holder WHERE name = ? and student_id = ? and university = ? and department = ?", [ name, studentId, university, department]);

		if(rows == undefined) return -1;
		else return 1;
	}
	catch(e) {
		consloe.error(e);
	}
	finally {
		if(conn) conn.release();
	}
  },
  saveHolder: async ({ name, studentId, university, department }) => {
    // signupVM : id, name, student_id, university, department, holder_did
    let conn;
    const newHolder = {
      name: name,
      student_id: studentId,
      university: university,
      department: department,
      holder_did: createDID(),
    };
    try {
      conn = await getConn();
      const [[rows]] = await conn.query("SELECT * FROM Holder WHERE name = ? and student_id = ? and university = ? and department = ?", [ name, studentId, university, department]);

      await conn.execute(
        "UPDATE Holder SET holder_did = ? WHERE name = ? and student_id = ? and university = ? and department = ?",
        [
	  newHolder.holder_did,
          newHolder.name,
          newHolder.student_id,
          newHolder.university,
          newHolder.department
        ]
      );
     // const [[rows]] = await conn.query(
     //   "SELECT * FROM Holder order by id DESC limit 1"
     // );
      return rows.id; 
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  saveStudentIdCard: async (holderId) => {
    let temp  = new Date();
    const utc = temp.getTime() + (temp.getTimezoneOffset() * 60 * 1000);
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const today = new Date(utc + (KR_TIME_DIFF));

    let conn;
    const newStudentCard = {
      card_did: createDID(),
      verified_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      expire_date: getExpireDate(today),
      holder_id: holderId,
      issuer_id: 1,
      status: "ACTIVATED",
    };

    try {
      conn = await getConn();
      await conn.execute(
        "INSERT INTO StudentIdCard(card_did, verified_date, expire_date, holder_id, issuer_id, status) values(?, ?, ?, ?, ?, ?)",
        [
          newStudentCard.card_did,
          newStudentCard.verified_date,
          newStudentCard.expire_date,
          newStudentCard.holder_id,
          newStudentCard.issuer_id,
          newStudentCard.status,
        ]
      );
      // Card{Card_did: args[0], Holder_id: args[1], Issuer_id: args[2], Update_date: args[3]}
      const [[rows]] = await conn.query(
        "SELECT card_did, holder_id, issuer_id FROM StudentIdCard order by id DESC limit 1"
      );
      let args = [
        rows.card_did,
        rows.holder_id.toString(),
        rows.issuer_id.toString(),
        newStudentCard.expire_date
      ];
      const result = await send(1, "setCard", args);
      return [rows.holder_id, rows.card_did];
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = {
  userService,
  getExpireDate,
};



