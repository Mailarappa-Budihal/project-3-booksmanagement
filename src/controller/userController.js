const userModel = require('../models/userModel')
const validator = require('../validators/validator')
const validation = require("validator");
const jwt = require('jsonwebtoken');

const createUser = async function(req, res) {

        try {
            let data = req.body;
            let { title, name, phone, email, password, address } = data
            //-----------------------validation for ReqBody------------------------------------//

            if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "Request body cannot be empty,please provide user details to create user" })

            //-----------------------validation for title------------------------------------//
            if (!validator.isValidEnum(title)) return res.status(400).send({ status: false, msg: "Please enter a valid title,available titles are ['Mr','Mrs','Miss.]" })
                //-----------------------validation for name------------------------------------//
            if (!validator.isValid(name)) return res.status(400).send({ status: false, msg: "name is Mandatory" })
                //-----------------------validation for email------------------------------------//
            if (!validator.isValid(email)) return res.status(400).send({ status: false, msg: "email is Mandatory" })

            if (!validation.isEmail(email)) return res.status(400).send({ status: false, msg: "please provide valid email" })
                //-----------------------validation for phone------------------------------------//
            if (!validator.isValid(phone)) return res.status(400).send({ status: false, msg: "phone number is mandatory" })

            const mobile = /^(\+\d{1,3}[- ]?)?\d{10}$/.test(phone)
            if (mobile == false) return res.status(400).send({ status: false, msg: "Mobile number should be a valid Indian mobile number" })
                //-----------------------validation for password------------------------------------//
            if (!validator.isValid(password)) return res.status(400).send({ status: false, msg: "password is Mandatory" })

            const password1 = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,15})/.test(password)
            if (password1 == false) return res.status(400).send({ status: false, msg: "Password should contain min:8 and max:15 characters " })
                //-----------------------validation for address------------------------------------//
            if (address) {

                if (typeof address != "object") return res.status(400).send({ status: false, msg: "Type of address must be object" })

                if (Object.keys(address).length === 0) return res.status(400).send({ status: false, msg: "Address body cannot be empty,please provide address details" })

                if (!validator.isValid(address.street)) return res.status(400).send({ status: false, msg: "street is Mandatory" })

                if (!validator.isValid(address.city)) return res.status(400).send({ status: false, msg: "city is Mandatory" })

                if (!validator.isValid(address.pincode)) return res.status(400).send({ status: false, msg: "pincode is Mandatory" })
            }

            //-----------------------validation for Duplicate phone,email-----------------------------------//
            let dupPhone = await userModel.findOne({ phone: phone })
            if (dupPhone) return res.status(409).send({ status: false, msg: `This mobile number is ${phone} already in use ` })

            let dupEmail = await userModel.findOne({ email: email })
            if (dupEmail) return res.status(409).send({ status: false, msg: `This email id is ${email} already in use ` })

            //-----------------------create user------------------------------------//
            let createdUser = await userModel.create(data)
            return res.status(201).send({ status: true, msg: "Success", data: createdUser })
                //console.log(createdUser)
        } catch (err) {
            return res.status(500).send({ status: false, msg: err.message })
        }


    } //function ends here

const loginUser = async function(req, res) {
    try {
        let data = req.body;
        let { email, password } = data
        //-----------------------validation for Reqbody------------------------------------//
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "User credentials body empty!!" })
            //-----------------------validation for email------------------------------------//
        if (!validator.isValid(email)) return res.status(400).send({ status: false, msg: "email is required!!" })
            //-----------------------validation for password------------------------------------//
        if (!validator.isValid(password)) return res.status(400).send({ status: false, msg: "password is required!!" })
            //-----------------------finding user in user collection------------------------------------//
        let findUser = await userModel.findOne({ email, password })
        if (!findUser) return res.status(401).send({ status: false, msg: "Invalid login credentials" })

        let id = findUser._id;
        //-----------------------creating the Token------------------------------------//
        let payload = {
            userId: id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
        }

        const token = jwt.sign(payload, 'Group-69-Project-3')
        return res.status(200).send({ status: true, msg: "User logged in succesfully", data: token, iat: payload.iat, exp: payload.exp })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }


}

module.exports = { createUser, loginUser };