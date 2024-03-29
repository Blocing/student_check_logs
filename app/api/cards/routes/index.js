const { StudentIdCard, putExpireDate, getStudent  } = require("../controllers");
const router = require("express").Router();

/**
 * @description 학생증 조회
 * @routes GET /idcard/{holder_id}
 * @request @param holder_id
 */
router.get("/:holder_id", StudentIdCard);

/**
 * @description 학생 인증 조회
 * @routes GET /idcard/{did}
 * @request @param did
 */
router.get("/auth/:did", getStudent);

/**
 * @description 학생증 재발급
 * @routes GET /idcard/activate/{holder_id}
 * @request @param holder_id
 */
router.put("/activate/:holder_id", putExpireDate);
module.exports = router;
