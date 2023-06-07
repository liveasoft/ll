const router = require('express').Router()
const userCtrl = require('../controller/userCtrl')
const auth = require('../middleware/auth')

router.post('/register', userCtrl.register)
router.post('/login', userCtrl.login)
router.get('/get_user_info', auth, userCtrl.get_user_info)
router.get('/all_users', auth, userCtrl.all_users)



module.exports = router