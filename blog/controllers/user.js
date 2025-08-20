const userRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')

userRouter.get("/", async (req, res) => {
	const users = await User.find({})
	res.json(users)
})

userRouter.post('/', async (req, res) => {
	const {name, username, password} = req.body

	if (password && password.length < 3) {
		return res.status(400).json({ error: 'password must be at least 3 characters long' })
	}

	const passwordHash = await bcrypt.hash(password, 10)

	const newUser = new User({
		name,
		username,
		passwordHash
	})

	const savedUser = await newUser.save()

	res.status(201).json(savedUser)
})

module.exports = userRouter