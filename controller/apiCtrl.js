const mongoose = require('mongoose')
const dataset = mongoose.model('datasets', mongoose.Schema({}, { strict: false }))
const workerque = mongoose.model('workerques', mongoose.Schema({}, { strict: false }))
const axios = require('axios')
const cheerio = require('cheerio')

const apiCtrl = {
    profiles: async (req, res) => {
        try {
            const { type, user_id } = req.body

            if (!type || !user_id)
                return res.status(400).json({ error: "All feilds are required" })

            const query = {
                "user_profile.type": type,
                "user_profile.user_id": { $regex: user_id, $options: "i" } // regex => regular expression , options i = incase sensitive
            }

            const response_params = {
                _id: 0,
                'user_profile.type': 1,
                'user_profile.user_id': 1,
                'user_profile.picture': 1,
                'user_profile.followers': 1,
                'user_profile.fullname': 1
            }

            dataset.find(query, response_params)
                .limit(5)
                .sort({
                    "user_profile.user_id": -1
                })
                .then(docs => {
                    res.status(200).json({ success: 1, data: docs })
                })
                .catch(err => {
                    res.status(500).json({ msg: err.message })
                })

        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    },
    profile: async (req, res) => {
        try {
            const { type, user_id } = req.body

            if (!type || !user_id)
                return res.status(400).json({ error: "All feilds are required" })

            const query = {
                "user_profile.type": type,
                "user_profile.user_id": user_id
            }


            dataset.find(query)
                .limit(1)
                .sort({
                    "user_profile.user_id": -1
                })
                .then(docs => {
                    res.status(200).json({ success: 1, data: docs })
                })
                .catch(err => {
                    res.status(500).json({ msg: err.message })
                })

        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    },
    profile_insight: async (req, res) => {
        try {
            const { type, username } = req.body

            if (!type || !username)
                return res.status(400).json({ error: "All feilds are required" })

            const query = {
                "user_profile.type": type,
                "user_profile.username": username
            }


            dataset.find(query)
                .limit(1)
                .sort({
                    "user_profile.username": -1
                })
                .then(docs => {
                    res.status(200).json({ success: 1, data: docs })


                    if (docs.length <= 0) {

                        var url;

                        switch (type) {
                            case 'tiktok':
                                url = 'https://www.tiktok.com/@' + username
                                break;

                            case 'instagram':
                                url = 'https://www.instagram.com/' + username
                                break;

                            case 'youtube':
                                url = 'https://www.youtube.com/@' + username
                                break;

                            case 'twitch':
                                url = 'https://www.twitch.tv/' + username
                                break;

                            case 'twitter':
                                url = 'https://twitter.com/' + username
                                break;

                            default:
                                break;
                        }


                        // Fetch the HTML content using axios
                        axios.get(url)
                            .then(async response => {
                                if (response.status == 200) {
                                    // FIND ALREADY EXIST
                                    const data = await workerque.find({ "type": type, "username": username })

                                    if (data.length <= 0) {
                                        var currentdate = new Date()
                                        const newque = new workerque({
                                            type: type,
                                            username: username,
                                            url: url,
                                            status: 0,
                                            created_at: currentdate.toISOString(),
                                            updated_at: [{
                                                datetime: currentdate.toISOString(),
                                                work: 'Dataset has to create'
                                            }]
                                        })

                                        try {
                                            await newque.save()
                                        } catch (error) {
                                            console.log(error)
                                        }

                                        console.log('QUE SAVED')

                                    } else {
                                        try {
                                            const today = new Date() // Current date
                                            const lastupdated = new Date(data[0].updated_at.at(-1))
                                            // Calculate the difference in milliseconds between the two dates
                                            const diffInMilliseconds = today - lastupdated;
                                            // Calculate the difference in days by dividing the difference in milliseconds by the number of milliseconds in a day
                                            const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
                                            // const fiveDaysAgo = new Date();
                                            // fiveDaysAgo.setDate(today.getDate() - 5); // Date 5 days ago
                                            if (diffInDays > 5){
                                                await workerque.findByIdAndUpdate(data[0]._id, { status: 0 })
                                                console.log('QUE UPDATED')
                                            }else{
                                                console.log('ALREADY UPDATED RECENTLY WITHIN 5 DAYS')
                                            }
                                                
                                        } catch (error) {
                                            console.log(error)
                                        }
                                    }

                                } else if (response.status == 404) {
                                    console.log("Incorrect Profile")
                                }
                            })
                            .catch(error => {
                                console.error('Error fetching URL:' +  url);
                            });
                    }

                })
                .catch(err => {
                    res.status(500).json({ msg: err.message })
                })

        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    }
}


module.exports = apiCtrl