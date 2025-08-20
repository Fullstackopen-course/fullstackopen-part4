const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const assert = require('node:assert')
const Blog = require('../models/blog')
const User = require('../models/user')
const { initialBlogs, blogsInDb, usersInDb, initialUsers } = require('./utils/test_helper')

const api = supertest(app)

describe('blogs', () => {
	beforeEach(async () => {
		await Blog.deleteMany({})

		const BlogObjects = initialBlogs.map((blog) => new Blog(blog))
		const promiseArray = BlogObjects.map((blog) => blog.save())
		await Promise.all(promiseArray)
	})

	describe('get blogs', () => {
		test('blogs are returned as json', async () => {
		await api
			.get('/api/blogs')
			.expect(200)
			.expect('Content-Type', /application\/json/)
		})

		test('amount of blogs is correct', async () => {
			const response = await api.get('/api/blogs')

			assert.strictEqual(response.body.length, initialBlogs.length)
		})

		test('all blogs are uniquely identified by id property', async () => {
			const blogs = await blogsInDb()

			const ids = blogs.map(blog => blog.id)
			assert.strictEqual(ids.length, new Set(ids).size)
		})
	})

	describe('post blog', () => {
		test('a valid blog can be added', async () => {
			const newBlog = {
				title: 'New blog',
				author: 'John Doe',
				url: 'https://johndoe.com/',
				likes: 1
			}

			await api
				.post('/api/blogs')
				.send(newBlog)
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const response = await api.get('/api/blogs')

			const titles = response.body.map(b => b.title)

			assert.strictEqual(response.body.length, initialBlogs.length + 1)
			assert(titles.includes(newBlog.title))
		})

		test('request without like property defaults it to 0', async () => {
			const newBlog = {
				author: 'John Doe',
				url: 'https://johndoe.com/',
				title: 'New blog'
			}

			await api
				.post('/api/blogs')
				.send(newBlog)
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const response = await api.get('/api/blogs')

			const blog = response.body.find(b => b.title === newBlog.title)

			assert.strictEqual(response.body.length, initialBlogs.length + 1)
			assert(blog.likes === 0)
		})

		test('request without title or url properties returns 400 Bad Request', async () => {
			const newBlog = {
				title: 'New blog',
				author: 'John Doe',
				likes: 1
			}
			const newBlog2 = {
				url: 'https://johndoe.com/',
				author: 'John Doe',
				likes: 1
			}

			await api
				.post('/api/blogs')
				.send(newBlog)
				.expect(400)

			await api
				.post('/api/blogs')
				.send(newBlog2)
				.expect(400)
		})
	})

	describe('delete blog', () => {
		test('a blog can be deleted by id', async () => {
			const blogs = await blogsInDb()

			const blogToDelete = blogs[0]

			await api
				.delete(`/api/blogs/${blogToDelete.id}`)
				.expect(204)

			const response = await api.get('/api/blogs')

			assert.strictEqual(response.body.length, initialBlogs.length - 1)
		})
	})

	describe('delete blog', () => {
		test('a blog can be deleted by id', async () => {
			const blogs = await blogsInDb()

			const blogToDelete = blogs[0]

			await api
				.delete(`/api/blogs/${blogToDelete.id}`)
				.expect(204)

			const response = await api.get('/api/blogs')

			assert.strictEqual(response.body.length, initialBlogs.length - 1)
		})
	})

	describe('update blog', () => {
		test('a blog can be updated by id', async () => {
			const blogs = await blogsInDb()

			const blogToUpdate = blogs[0]

			const updatedBlog = {
				title: 'Updated blog',
				author: 'John Doe',
				url: 'https://johndoe.com/',
				likes: 1
			}

			await api
				.put(`/api/blogs/${blogToUpdate.id}`)
				.send(updatedBlog)
				.expect(200)
				.expect('Content-Type', /application\/json/)

			const response = await api.get('/api/blogs')

			const blog = response.body.find(b => b.id === blogToUpdate.id)

			assert.strictEqual(response.body.length, initialBlogs.length)
			assert(blog.title === updatedBlog.title)
		})
	})
})


describe('users', () => {
	beforeEach(async () => {
		await User.deleteMany({})

		const userObjects = initialUsers.map(({password, ...rest}) =>
			new User({
				...rest,
				passwordHash: bcrypt.hashSync(password, 10)
			})
		)
		const promiseArray = userObjects.map((u) => u.save())
		await Promise.all(promiseArray)
	})

	describe('get users', () => {
		test('users are returned as json', async () => {
		await api
			.get('/api/users')
			.expect(200)
			.expect('Content-Type', /application\/json/)
		})

		test('amount of users is correct', async () => {
			const response = await api.get('/api/users')

			assert.strictEqual(response.body.length, initialUsers.length)
		})

		test('all users are uniquely identified by id property', async () => {
			const res = await api.get('/api/users')
			const users = res.body

			const ids = users.map(u => u.id)
			assert.strictEqual(ids.length, new Set(ids).size)
		})
	})

	describe('post user', () => {
		test('creation succeeds with a new username', async () => {
			const usersAtStart = await usersInDb()

			const newUser = {
				username: 'mluukkai',
				name: 'Matti Luukkainen',
				password: 'salainen',
			}

			await api
				.post('/api/users')
				.send(newUser)
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const usersAtEnd = await usersInDb()
			assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

			const usernames = usersAtEnd.map(u => u.username)
			assert(usernames.includes(newUser.username))
		})

		test('creation fails with proper statuscode and message if username is non unique', async () => {
			const newUser = initialUsers[0]

			await api
				.post('/api/users')
				.send(newUser)
				.expect(400)
				.expect('Content-Type', /application\/json/)
				.expect({
					error: 'expected `username` to be unique'
				})
		})

		test('creation fails with proper status code and message if password is too short', async () => {
			let newUser = initialUsers[0]
			newUser.password = '12'

			await api
				.post('/api/users')
				.send(newUser)
				.expect(400)
				.expect('Content-Type', /application\/json/)
				.expect({
					error: 'password must be at least 3 characters long'
				})
		})
	})
})


after(async () => {
  await mongoose.connection.close()
})