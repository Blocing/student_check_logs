const {EmailService, registerService} = require('../controllers');
const router = require('express').Router();

/**
 * @description 이메일 전송
 * @routes POST /user/send/email
 * @request @body {email}
 */
router.post('/email/send', EmailService);

/**
 * @description 회원가입(학생증)
 * @routes POST /user/signup
 * @request @body {}
 */
router.post('/signup', registerService);

module.exports = router;