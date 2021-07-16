const { addAttendance, getClasses, getList } = require("../controllers");
const router = require("express").Router();

/**
 * @description ?•™?ƒì¦? ì¡°íšŒ
 * @routes GET /idcard/{holder_id}
 * @request @body body
 */
router.post("/", addAttendance);
router.get("/classes", getClasses);
router.get("/list/:holder_id/:class_id", getList);

module.exports = router;
