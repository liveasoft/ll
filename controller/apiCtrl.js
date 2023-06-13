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
                                            if (diffInDays > 5) {
                                                await workerque.findByIdAndUpdate(data[0]._id, { status: 0 })
                                                console.log('QUE UPDATED')
                                            } else {
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
                                console.error('Error fetching URL:' + url);
                            });
                    }

                })
                .catch(err => {
                    res.status(500).json({ msg: err.message })
                })

        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    },
    profiles_listing: async (req, res) => {
        try {
            const { type, page, sortby, filters } = req.body

            if (!type || !page)
                return res.status(400).json({ error: "All feilds are required" })

            let query = {
                "user_profile.type": type
            }

            // ADD FILTERS

            // ENGAGEMENT RATE
            if (filters.engagement_rate && filters.engagement_rate.value) {
                query["user_profile.engagement_rate"] = { $gte: filters.engagement_rate.value };
            }

            // ENGAGEMENT 
            if (filters.engagements && filters.engagements.left_number && filters.engagements.right_number) {
                query["user_profile.engagements"] = {
                    $gte: filters.engagements.left_number,
                    $lte: filters.engagements.right_number
                };
            } else if (filters.engagements && filters.engagements.left_number) {
                query["user_profile.engagements"] = {
                    $gte: filters.engagements.left_number
                };
            } else if (filters.engagements && filters.engagements.right_number) {
                query["user_profile.engagements"] = {
                    $lte: filters.engagements.right_number
                };
            }

            // FOLLOWERS 
            if (filters.followers && filters.followers.left_number && filters.followers.right_number) {
                query["user_profile.followers"] = {
                    $gte: filters.followers.left_number,
                    $lte: filters.followers.right_number
                };
            } else if (filters.followers && filters.followers.left_number) {
                query["user_profile.followers"] = {
                    $gte: filters.followers.left_number
                };
            } else if (filters.followers && filters.followers.right_number) {
                query["user_profile.followers"] = {
                    $lte: filters.followers.right_number
                };
            }

            // VIEWS 
            if (filters.avg_views && filters.avg_views.left_number && filters.avg_views.right_number) {
                query["user_profile.avg_views"] = {
                    $gte: filters.avg_views.left_number,
                    $lte: filters.avg_views.right_number
                };
            } else if (filters.avg_views && filters.avg_views.left_number) {
                query["user_profile.avg_views"] = {
                    $gte: filters.avg_views.left_number
                };
            } else if (filters.avg_views && filters.avg_views.right_number) {
                query["user_profile.avg_views"] = {
                    $lte: filters.avg_views.right_number
                };
            }

            // AGE 
            if (filters.age && filters.age.left_number && filters.age.right_number) {
                query["user_profile.age"] = {
                    $gte: filters.age.left_number,
                    $lte: filters.age.right_number
                };
            } else if (filters.age && filters.age.left_number) {
                query["user_profile.age"] = {
                    $gte: filters.age.left_number
                };
            } else if (filters.age && filters.age.right_number) {
                query["user_profile.age"] = {
                    $lte: filters.age.right_number
                };
            }

            // REEL PLAYS 
            if (filters.avg_reels_plays && filters.avg_reels_plays.left_number && filters.avg_reels_plays.right_number) {
                query["user_profile.avg_reels_plays"] = {
                    $gte: filters.avg_reels_plays.left_number,
                    $lte: filters.avg_reels_plays.right_number
                };
            } else if (filters.avg_reels_plays && filters.avg_reels_plays.left_number) {
                query["user_profile.avg_reels_plays"] = {
                    $gte: filters.avg_reels_plays.left_number
                };
            } else if (filters.avg_reels_plays && filters.avg_reels_plays.right_number) {
                query["user_profile.avg_reels_plays"] = {
                    $lte: filters.avg_reels_plays.right_number
                };
            }

            // INFLUENCER GENDER
            if (filters.gender && filters.gender.code) {
                query["user_profile.gender"] = {
                    $regex: new RegExp(filters.gender.code, "i")
                }
            }

            // AUDIENCE GENDER
            if (filters.audience_gender && filters.audience_gender.code && filters.audience_gender.weight) {
                query["audience_followers.data.audience_genders"] = {
                    $elemMatch: {
                        "code": new RegExp(filters.audience_gender.code, "i"),
                        "weight": { $gte: filters.audience_gender.weight }
                    }
                }
            }

            // INFLUENCER GEO
            if (filters.geo && filters.geo.length > 0) {
                filters.geo = filters.geo.map(item => item.toUpperCase())
                query["user_profile.geo.country.code"] = { $in: filters.geo }
            }

            // AUDIENCE GEO
            if (filters.audience_geo && filters.audience_geo.length > 0) {
                filters.audience_geo = filters.audience_geo.map(item => ({
                    code: item.code.toUpperCase(),
                    weight: item.weight
                }))
                query["audience_followers.data.audience_geo.countries"] = {
                    $elemMatch: {
                        $or: filters.audience_geo.map(filter => ({
                            code: filter.code,
                            weight: { $gte: filter.weight }
                        }))
                    }
                }
            }

            // AUDIENCE AGE
            if (filters.audience_age && filters.audience_age.length > 0) {
                query["audience_followers.data.audience_ages"] = {
                    $elemMatch: {
                        $or: filters.audience_age.map(filter => ({
                            code: filter.code,
                            weight: { $gte: filter.weight }
                        }))
                    }
                }
            }

            // BIO INFORMATION
            if (filters.text) {
                query["user_profile.description"] = {
                    $regex: new RegExp(filters.text, "i")
                }
            }

            // LAST POSTED
            if (filters.last_posted) {
                const currentdate = new Date();
                currentdate.setDate(currentdate.getDate() - filters.last_posted);
                query["user_profile.recent_posts"] = {
                    $elemMatch: {
                        created: { $gte: currentdate.toISOString() }
                    }
                }
            }

            // AUDIENCE LANGUAGE
            if (filters.audience_lang && filters.audience_lang.code && filters.audience_lang.weight) {
                query["audience_followers.data.audience_languages"] = {
                    $elemMatch: {
                        "code": new RegExp(filters.audience_lang.code, "i"),
                        "weight": { $gte: filters.audience_lang.weight }
                    }
                }
            }

            // KEYWORDS
            if (filters.keywords) {
                query.$or = [
                    { "user_profile.recent_posts": { $elemMatch: { text: new RegExp(filters.keywords, "i") } } },
                    { "user_profile.top_posts": { $elemMatch: { text: new RegExp(filters.keywords, "i") } } }
                ]
            }

            // INFLUENCER LANGUAGE
            if (filters.lang && filters.lang.code) {
                query["user_profile.language.code"] = filters.lang.code
            }

            // CONTACTS
            if (filters.with_contact && filters.with_contact.length > 0) {
                query["user_profile.contacts"] = {
                    $elemMatch: {
                        $or: filters.with_contact.map(filter => ({
                            type: filter.type
                        }))
                    }
                };
            }

            // IS VERIFIED
            if (filters.is_verified) {
                query["user_profile.is_verified"] = filters.is_verified
            }

            // IS PRIVATE
            if (filters.is_hidden) {
                query["user_profile.is_hidden"] = filters.is_hidden
            }

            // HAS AUDIENCE DATA
            if (filters.has_audience_data) {
                query["audience_followers.success"] = filters.has_audience_data
            }

            // AUDIENCE LOOKALIKES
            if (filters.audience_relevance && filters.audience_relevance.value) {
                query['audience_followers.data.audience_lookalikes'] = { $elemMatch: { username: new RegExp(filters.audience_relevance.value.substring(1), "i") } }
            }

            // SIMILAR INFLUENCER
            if (filters.relevance && filters.relevance.value) {
                query['user_profile.similar_users'] = { $elemMatch: { username: new RegExp(filters.relevance.value.substring(1), "i") } }
            }


            // GROWTH RATE
            if (filters.followers_growth && filters.followers_growth.interval) {
           
            }


            const pageNumber = page;  // The page number you want to retrieve
            const pageSize = 2;  // The number of documents per page

            const sort = {
                [sortby === 'followers' ? 'user_profile.followers' : 'user_profile.engagements']: -1
            }



            dataset.countDocuments(query)
                .then(totalCount => {
                    dataset.find(query, {
                        "user_profile.picture": 1,
                        "user_profile.user_id": 1,
                        "user_profile.username": 1,
                        "user_profile.url": 1,
                        "user_profile.followers": 1,
                        "user_profile.engagements": 1,
                        "user_profile.fullname": 1,
                        "_id": 0
                    })
                        .limit(pageSize).skip((pageNumber - 1) * pageSize)
                        .sort(sort)
                        .then(docs => {
                            res.status(200).json({ success: 1, data: docs, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSize), recordsPerPage: pageSize });
                        })
                        .catch(err => {
                            res.status(500).json({ msg: err.message });
                        });
                })
                .catch(err => {
                    res.status(500).json({ msg: err.message });
                });

        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    }
}


module.exports = apiCtrl