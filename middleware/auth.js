const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    try {

        // Check if the Authorization header exists in the request
        if (!req.headers || !req.headers.authorization) { return res.status(400).json({ error: "Invalid Authentication" }) }

        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;

        // Split the header value to separate the token
        const token = authHeader.split(' ')[1]; // Assuming Bearer token is used

        // const token = req.cookies.access_token
        if (!token)
            return res.status(400).json({ error: "Invalid Authentication", code : 401 })



        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err)
                return res.status(400).json({ error: "Invalid Authentication", code : 401 })

            req.user = user
            next()
        })
    } catch (err) {
        res.status(500).json({ msg: err.message })
    }
}

module.exports = auth

