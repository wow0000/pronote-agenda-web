self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open('v3').then(function (cache) {
			return cache.addAll([
				'/',
				'/index.html',
				'/manifest.json',
				'/js/index.js',
				'/js/flatpickr.js',
				"/css/bootstrap.min.css",
				"/css/flatpickr.min.css"
			]);
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(caches.match(event.request).then(function (response) {
		// caches.match() always resolves
		// but in case of success response will have value
		if (response !== undefined) {
			return response;
		} else {
			return fetch(event.request).then(function (response) {
				// response may be used only once
				// we need to save clone to put one copy in cache
				// and serve second one
				let responseClone = response.clone();

				caches.open('v3').then(function (cache) {
					cache.put(event.request, responseClone).then(r => console.log("Cached " + r));
				});
				return response;
			}).catch(function (err) {
				console.log("Failed to load", err);
				return "";
			});
		}
	}));
});