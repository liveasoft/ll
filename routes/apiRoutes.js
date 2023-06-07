const router = require('express').Router()
const apiCtrl = require('../controller/apiCtrl')
const auth = require('../middleware/auth')

router.post('/profiles', auth, apiCtrl.profiles)
router.post('/profile', auth, apiCtrl.profile)
router.post('/profile_insight', auth, apiCtrl.profile_insight)



module.exports = router