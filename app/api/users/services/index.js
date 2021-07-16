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
  let year = today.getFullYear(); // ?��?���덌?��?���?
  let month = today.getMonth() + 1; // ?��?��?��
  let date = today.getDate(); // ?��?��?��筌욑?��
  let hour = today.getHours(); // ?��?��?��?��?���?
  let minute = today.getMinutes();
  let second = today.getSeconds();
  // const thisFirstSemester = year+'?��?����3?��?��?��1?��?���?23?��?���?59�겫?���?59�룯?���?';
  const thisFirstSemester = moment(
    year + "-03-01 23:59:59",
    "YYYY-MM-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");
  // const thisSecondSemester = year+'?��?����9?��?��?��1?��?���?23?��?���?59�겫?���?59�룯?���?';
  const thisSecondSemester = moment(
    year + "-09-01 23:59:59",
    "YYYY-MM-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");
  // const nextFirstSemester = (year+1)+'?��?����9?��?��?��1?��?���?23?��?���?59�겫?���?59�룯?���?';
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
        "INSERT INTO Holder(name, student_id, university, department, holder_did) values(?, ?, ?, ?, ?)",
        [
          newHolder.name,
          newHolder.student_id,
          newHolder.university,
          newHolder.department,
          newHolder.holder_did,
        ]
      );
      const [[rows]] = await conn.query(
        "SELECT * FROM Holder order by id DESC limit 1"
      );
      return rows.id; // ?��?��쾻嚥?��빜釉�? ?��?��린占?���? ?��?��?��?��귣똻�벥 ��?��쥙��� number
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  saveStudentIdCard: async (holderId) => {
    //�뇡?��?���?筌ｋ?���뵥?��?��?�� ?��?��린占?���? ?��?��?��?��귣똻?��?��?��?��?��?��?��?���??��??�옙
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
      //�뇡?��?���?筌ｋ?���뵥?��?��?�� ?��?��?��?��?��?���삢?��?���??��??�옙
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
      console.log(args);
      console.log(
        "===========�뇡?��?���?筌ｋ?���뵥 ?��?��?��?��?��?��?��?��?�� ?��?��린占?��문筌?��?�� ?��?��?��?��?��?���삢 (setCard)==========="
      );
      const result = await send(1, "setCard", args);
      console.log(`${result}?��?���??��?��빍占?���?`);
      return rows.holder_id;
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



// �̸��� ��������
// createEmail: async ({ email }) => {
  //   console.log("Service createEmail ?��?��뮇彛�?");
  //   const authCode = getAuthCode(6);
  //   let msg = "";
  //   msg += "<div style='margin:100px;'>";
  //   msg += "<h1> ?��?��?��?��?���욑?��?���占?��?��?��?��?�� ?��?��?��筌ｌ뮉堉�占?��?��?��?��?��?��경뤃?�����??��?��빍占?���? :) </h1> <br>";
  //   msg +=
  //     "<p>?��?��?��?��?��?��?��?��?��?��?���??��?���? ?��?��맄占?���??��?��?�� ?��?��?��?��?��?��?��?���? ?��?��뵥筌?��?�� ?��곕뜇�깈�몴?���? ?��?��?��?��?��뵥占?���??��?���? ?��?��?��, ?��?��?��?��?��?��?��?��?��?��?���? 筌≪?��?���? ?��?���??��?��?��?��?���??��?��?�� ?��?��?���뻻?��꿸�?��?��?��?��뿻占?��빍占?���?.<p> <br>";
  //   msg += "<div align='center' style='border:1px solid black;>";
  //   msg += "<h3 style='color:blue;'>?��?��뵥筌?��?�� ?��곕뜇�깈?��?���??��?��빍占?���?.</h3>";
  //   msg += "<div style='font-size:130%'>";
  //   msg += "<strong>" + authCode + "</strong><div><br/> </div>";

  //   const mail = {
  //     toAddress: email,
  //     title: "[?��?��?��筌ｌ뮉堉�占?��?��?��?��?��?��경뤃?���?] ?��?��?��?��?��?�� ?��?��?��?��?���? ?��?��뵥筌?��?�� 筌롫?���뵬 ?��?��?��?��?��???",
  //     contents: msg,
  //     authCode,
  //   };
  //   return mail;
  // },
  // authEmail: async (email) => {
  //   console.log("Service authEmail ?��?��뮇彛�?");
  //   let transporter = nodemailer.createTransport({
  //     service: "Gmail",
  //     auth: {
  //       user: process.env.GOOGLE_ID,
  //       pass: process.env.GOOGLE_PASSWORD,
  //     },
  //   });
  //   let mailOptions = {
  //     from: process.env.GOOGLE_ID,
  //     to: email.toAddress,
  //     subject: email.title,
  //     html: email.contents,
  //   };
  //   transporter.sendMail(mailOptions, (error, info) => {
  //     if (error) console.log(error);
  //     else console.log(info.response + "?��?��?����?��?��");
  //   });
  //   return email.authCode;
  // },