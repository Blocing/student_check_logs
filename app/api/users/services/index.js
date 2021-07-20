const nodemailer = require("nodemailer");
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
  // const thisFirstSemester = year+'? ?Žˆï¿½ï¿½3? ?ŽŒ?œž1? ?ŽŒëµ?23? ?Žˆë»?59ï¿½ê²«? ï¿?59ï¿½ë£¯? ï¿?';
  const thisFirstSemester = moment(
    year + "-03-01 23:59:59",
    "YYYY-MM-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");
  // const thisSecondSemester = year+'? ?Žˆï¿½ï¿½9? ?ŽŒ?œž1? ?ŽŒëµ?23? ?Žˆë»?59ï¿½ê²«? ï¿?59ï¿½ë£¯? ï¿?';
  const thisSecondSemester = moment(
    year + "-09-01 23:59:59",
    "YYYY-MM-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");
  // const nextFirstSemester = (year+1)+'? ?Žˆï¿½ï¿½9? ?ŽŒ?œž1? ?ŽŒëµ?23? ?Žˆë»?59ï¿½ê²«? ï¿?59ï¿½ë£¯? ï¿?';
  const nextFirstSemester = moment(
    1 + year + "-09-01 23:59:59",
    "YYYY-MM-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");
  // if(today.getMonth() == 1 || today.getMonth() == 2){
  //     return thisFirstSemester;
  // }
  if (moment(year + "-" + month + "-" + date).isBefore(year + "-03-01")) {
    // console.log(thisFirstSemester);
    return thisFirstSemester;
  } else if (
    moment(year + "-" + month + "-" + date).isBefore(year + "-09-01")
  ) {
    // console.log(thisSecondSemester);
    return thisSecondSemester;
  }
  // else if(today.getMonth() == 3 || today.getMonth() == 4 || today.getMonth() == 5 || today.getMonth() == 6 || today.getMonth() == 7 || today.getMonth() == 8){
  //     return thisSecondSemester;
  // }
  else {
    // console.log(nextFirstSemester);
    return nextFirstSemester;
  }
};
// getExpireDate(new Date());

const userService = {
  
  sendSMS: async (phoneNumber) => {
    console.log("Service createEmail");
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
    console.log(newHolder);
    try {
      conn = await getConn();
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
      const [[rows]] = await conn.query(
        "SELECT * FROM Holder order by id DESC limit 1"
      );
      return rows.id; 
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  saveStudentIdCard: async (holderId) => {
    let today = new Date();
    let conn;
    const newStudentCard = {
      card_did: createDID(),
      verified_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      expire_date: getExpireDate(today),
      holder_id: holderId,
      issuer_id: 1,
      status: "ACTIVATE",
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
      console.log(rows);
      let args = [
        rows.card_did,
        rows.holder_id.toString(),
        rows.issuer_id.toString(),
        moment().format("YYYY-MM-DD HH:mm:ss"),
      ];
      console.log("=========== (setCard)===========");
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



