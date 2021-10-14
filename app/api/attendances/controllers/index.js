const { attendanceService, getAttendanceList } = require("../services");

const attendanceController = {
  addAttendance: async (req, res, next) => {
    const result = JSON.parse(req.body.idx);
    const attendance_id = await attendanceService.addAttendance(result);
    if(attendance_id === ' ') res.status(201).json(0);
    else res.status(201).json(attendance_id);
  },
  getClasses: async (req,res, next) => {
    const result = await attendanceService.getClass();
    res.status(200).json(result);
  },
  getList: async (req, res, next) => {
    const {class_id, holder_id} = req.params;
    const result = await attendanceService.getAttendanceList(Number(class_id), Number(holder_id));
    res.status(200).json(result);
  }
};

module.exports = attendanceController;
