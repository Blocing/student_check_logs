const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../.env')} );
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AT;
const client = require("twilio")(accountSid, authToken);
const sendSMS = (to, content) => {
  client.messages
    .create({
      body: content,
      from: process.env.TWILIO_FROM,
      to: to,
    })
    .then((messages) => {
      console.log(messages);
    });
};

const sendVerificationSMS = (to, key) => {
  console.log("ZZ");
	sendSMS(to, `인증코드 : ${key}`);
};

sendVerificationSMS("01056999305", 1234);
module.exports = {
  sendVerificationSMS,
};
