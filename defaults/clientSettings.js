module.exports = {
	anonymousAccessRoutes: ['/', '/login'],
	unathorizedRedirectRoute: '/',
	notFoundRedirectRoutes: {
		default: '/',
		authenticated: '/'
	}
}
