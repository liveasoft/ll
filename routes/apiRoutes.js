const router = require('express').Router()
const apiCtrl = require('../controller/apiCtrl')
const auth = require('../middleware/auth')

router.post('/profiles', auth, apiCtrl.profiles)
router.post('/profile', auth, apiCtrl.profile)
router.post('/profile_insight', auth, apiCtrl.profile_insight)
router.post('/profiles_listing', auth, apiCtrl.profiles_listing)
router.post('/topic-tags', auth, apiCtrl.topic_tags)
router.post('/search-audience', auth, apiCtrl.search_audience)



module.exports = router