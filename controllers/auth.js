const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/User');
const keys = require('../config/keys');
const errorHandler = require('../utils/errorHandler');

module.exports.login = async function (req, res) {
    const candidate = await User.findOne({ email: req.body.email }).maxTimeMS(30000);

    if (candidate) {
        const passwordResult = bcrypt.compareSync(req.body.password, candidate.password);

        if (passwordResult) {
            const token = jsonwebtoken.sign({
                email: candidate.email,
                userId: candidate._id
            }, keys.jsonwebtoken, { expiresIn: 60 * 60 });

            res.status(200).json({
                token: `Bearer ${token}`
            });
        }
        else {
            res.status(401).json({
                message: 'Пароли НЕ совпадают'
            });
        }
    }
    else {
        res.status(404).json({
            message: 'Такой пользователь НЕ существует'
        });
    }
}

module.exports.register = async function (req, res) {
    const candidate = await User.findOne({ email: req.body.email }).maxTimeMS(30000);

    if (candidate) {
        res.status(409).json({
            message: 'Такой пользователь уже существует'
        });
    }
    else {
        const salt = bcrypt.genSaltSync(10);
        const password = req.body.password;
        const user = new User({
            email: req.body.email,
            password: bcrypt.hashSync(password, salt),
        });

        try {
            await user.save();
            res.status(201).json({ user });
        } catch (error) {
            errorHandler(res, error);
        }
    }
}