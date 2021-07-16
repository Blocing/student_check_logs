const { attendanceService, getAttendanceList } = require("../services");

const attendanceController = {
  addAttendance: async (req, res, next) => {
    const result = JSON.parse(req.body.idx);
    const attendance_id = await attendanceService.addAttendance(result);
    console.log(attendance_id);
    res.status(201).json(attendance_id);
  },
  getClasses: async (req,res, next) => {
    const result = await attendanceService.getClass();
    // console.log(result);
    res.status(200).json(result);
  },
  getList: async (req, res, next) => {
    const {class_id, holder_id} = req.params;
    console.log(class_id);
    console.log(holder_id);
    const result = await attendanceService.getAttendanceList(Number(class_id), Number(holder_id));
    console.log("TEST2");
    res.status(200).json(result);
  }
};

module.exports = attendanceController;
