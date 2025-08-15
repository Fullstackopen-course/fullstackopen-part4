const dummy = (blogs) => {
  return 1;
}

const totalLikes = (blogs) => {
	return blogs.reduce(
		(sumLikes, blog) => sumLikes + blog.likes,
		0
	)
};

module.exports = {
  dummy,
  totalLikes
}