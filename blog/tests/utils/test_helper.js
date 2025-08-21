const Blog = require('../../models/blog')
const User = require('../../models/user')

const initialUsers = [
	{
		name: 'user1',
		username: 'username1',
		password: 'password1'
	},
	{
		name: 'user2',
		username: 'username2',
		password: 'password2'
	}
]

const initialBlogs = [
	{
		title: 'blog1',
		author: 'author1',
		url: 'https://url1.com/',
		likes: 7,
	},
	{
		title: 'blog2',
		author: 'author2',
		url: 'http://url2.com/',
		likes: 5,
	}
]


const blogsInDb = async () => {
	const blogs = await Blog.find({})
	return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
	const users = await User.find({})
	return users.map(user => user.toJSON())
}

module.exports = {
	initialBlogs,
	blogsInDb,
	usersInDb,
	initialUsers
}