const { after, beforeEach, describe, it} = require('node:test')
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
		await User.deleteMany({})
		await Blog.deleteMany({})

		const user1 = new User({
			username: 'user1',
			name: 'user1',
			passwordHash: await bcrypt.hash('password1', 10)
		})
		const savedUser1 = await user1.save()

		const user2 = new User({
			username: 'user2',
			name: 'user2',
			passwordHash: await bcrypt.hash('password2', 10)
		})
		await user2.save()

		for (const blog of initialBlogs) {
			const newBlog = new Blog(blog)
			newBlog.user = savedUser1._id
			const savedBlog = await newBlog.save()
			savedUser1.blogs = savedUser1.blogs.concat(savedBlog._id)
		}

		await savedUser1.save()
	})

	describe('get blogs', () => {
		it('blogs are returned as json', async () => {
			await api
				.get('/api/blogs')
				.expect(200)
				.expect('Content-Type', /application\/json/)
		})

		it('amount of blogs is correct', async () => {
			const response = await api.get('/api/blogs')

			assert.strictEqual(response.body.length, initialBlogs.length)
		})

		it('all blogs are uniquely identified by id property', async () => {
			const blogs = await blogsInDb()

			const ids = blogs.map(blog => blog.id)
			assert.strictEqual(ids.length, new Set(ids).size)
		})
	})

	describe('post blog', () => {
		let tokenUser1 = null
		let tokenUser2 = null

		beforeEach(async () => {
			const resUser1 = await api
				.post('/api/login')
				.send(
					{
						username: 'user1',
						password: 'password1'
					}
				)
			tokenUser1 = resUser1.body.token

			const resUser2 = await api
				.post('/api/login')
				.send(
					{
						username: 'user2',
						password: 'password2'
					}
				)
			tokenUser2 = resUser2.body.token
		})

		it('successful creation of a new blog by logged user 1', async () => {
			const newBlog = {
				title: 'New blog',
				author: 'user1',
				url: 'https://newblog.com/',
				likes: 1
			}

			const res = await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${tokenUser1}`)
				.send(newBlog)
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const response = await api.get('/api/blogs')

			const titles = response.body.map(b => b.title)

			assert.strictEqual(response.body.length, initialBlogs.length + 1)
			assert(titles.includes(newBlog.title))
		})

		it('failed creation of a new blog by invalid token', async () => {
			const newBlog = {
				title: 'New blog',
				author: 'user1',
				url: 'https://newblog.com/',
				likes: 1
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${null}`)
				.send(newBlog)
				.expect(401)
				.expect('Content-Type', /application\/json/)
		})

		it('failed creation of a new blog if not providing token', async () => {
			const newBlog = {
				title: 'New blog',
				author: 'user1',
				url: 'https://newblog.com/',
				likes: 1
			}

			await api
				.post('/api/blogs')
				.send(newBlog)
				.expect(401)
				.expect('Content-Type', /application\/json/)
		})

		it('request without like property defaults it to 0', async () => {
			const newBlog = {
				author: 'John Doe',
				url: 'https://johndoe.com/',
				title: 'New blog'
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${tokenUser1}`)
				.send(newBlog)
				.expect(201)
				.expect('Content-Type', /application\/json/)

			const response = await api.get('/api/blogs')

			const blog = response.body.find(b => b.title === newBlog.title)

			assert.strictEqual(response.body.length, initialBlogs.length + 1)
			assert(blog.likes === 0)
		})

		it('request without title or url properties returns 400 Bad Request', async () => {
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
				.set('Authorization', `Bearer ${tokenUser1}`)
				.send(newBlog)
				.expect(400)

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${tokenUser1}`)
				.send(newBlog2)
				.expect(400)
		})
	})

	describe('delete blog', () => {
		let tokenUser1 = null
		let tokenUser2 = null

		beforeEach(async () => {
			const resUser1 = await api
				.post('/api/login')
				.send(
					{
						username: 'user1',
						password: 'password1'
					}
				)
			tokenUser1 = resUser1.body.token

			const resUser2 = await api
				.post('/api/login')
				.send(
					{
						username: 'user2',
						password: 'password2'
					}
				)
			tokenUser2 = resUser2.body.token
		})

		it('a blog can be deleted by id, by its valid logged in user owner', async () => {
			const blogs = await blogsInDb()

			const blogToDelete = blogs[0]

			await api
				.delete(`/api/blogs/${blogToDelete.id}`)
				.set('Authorization', `Bearer ${tokenUser1}`)
				.expect(204)

			const response = await api.get('/api/blogs')

			assert.strictEqual(response.body.length, initialBlogs.length - 1)
		})

		it('a blog cant be deleted by id, by a valid logged user that is not its owner', async () => {
			const blogs = await blogsInDb()

			const blogToDelete = blogs[0]

			await api
				.delete(`/api/blogs/${blogToDelete.id}`)
				.set('Authorization', `Bearer ${tokenUser2}`)
				.expect(401)
		})
	})

	describe('update blog', () => {
		it('a blog can be updated by id', async () => {
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
		it('users are returned as json', async () => {
		await api
			.get('/api/users')
			.expect(200)
			.expect('Content-Type', /application\/json/)
		})

		it('amount of users is correct', async () => {
			const response = await api.get('/api/users')

			assert.strictEqual(response.body.length, initialUsers.length)
		})

		it('all users are uniquely identified by id property', async () => {
			const res = await api.get('/api/users')
			const users = res.body

			const ids = users.map(u => u.id)
			assert.strictEqual(ids.length, new Set(ids).size)
		})
	})

	describe('post user', () => {
		it('creation succeeds with a new username', async () => {
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

		it('creation fails with proper statuscode and message if username is non unique', async () => {
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

		it('creation fails with proper status code and message if password is too short', async () => {
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