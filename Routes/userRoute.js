import { Router } from "express";
import express from "express";
import { User } from "../Modals/users.js";
import { createJWT, hashPassword, comparePassword } from "../Middleware/auth.js";
import rateLimit from "express-rate-limit";

const userRouter = Router();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    handler: function (req, res, /*next*/) {
        const retryAfter = Math.ceil(res.getHeaders()['retry-after'] / 60); // Get the Retry-After header and convert it to minutes
        res.status(429).json({
            message: `Too many password retries, please try again after ${retryAfter} minutes`,
        });
    }
});
var app = express();
app.get('/', async (req, res) => { //this is /user/index page
    var users = await User.find({}).lean().exec();
    res.json(users);
});

app.post('/login', limiter, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).exec();
        const isValid = await comparePassword(user.password, req.body.password);
        if (!isValid) return res.json({ message: "Invalid password" });
        const token = createJWT(user);
        res.json({ message: token }); //will go in format token:value
    } catch (error) {
        console.log(error);
        res.json({ message: "Error occured" })
    }
})
app.post('/signup', async (req, res) => {
    try {
        const hash = await hashPassword(req.body.password);
        const user = await User.create({ ...req.body, password: hash });
        res.json(user); //will go in format token:value
    } catch (error) {
        res.json({ message: "Duplicate email" })
    }
})

export default userRouter;