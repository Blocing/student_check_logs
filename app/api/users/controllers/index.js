const { userService } = require("../services");

const userController = {
  EmailService: async (req, res, next) => {
    const { phoneNumber } = req.body;
    const result = await userService.sendSMS(phoneNumber);
    res.status(201).json({ success: true, authCode: result });
  },
  registerService: async (req, res, next) => {
    const { name, studentId, university, department } = req.body;
    const isOk = await userService.getHolder({name, studentId, university, department});
    if(isOk === -1) res.status(201).json({success: "failed"});
    else {
        const holderId = await userService.saveHolder({ name, studentId, university, department });
	const arr = await userService.saveStudentIdCard(holderId);
	const result = arr[0]; const card_did = arr[1];
	res.status(201).json({ success : "success", HolderId : result, CardDid : card_did, name : name, studentId : studentId, university : university, department: department });
    }
  },
};

module.exports = userController;
