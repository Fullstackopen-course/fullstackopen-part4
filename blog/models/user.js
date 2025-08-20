const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const userSchema = new mongoose.Schema({
	name: String,
	username: {
		type: String,
		unique: true,
		minLength: 3
	},
	passwordHash: String,
	blogs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Blog'
		}
	]
})

userSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
		delete returnedObject.passwordHash
	},
})

module.exports = mongoose.model('User', userSchema)