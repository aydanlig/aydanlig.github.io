(function () {
	"use strict";

	var TEXT_PROFANITY = [
		"fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy",
		"nigger", "faggot", "slut", "whore", "motherfucker", "retard"
	];
	var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
	var NSFW_THRESHOLDS = {
		Porn: 0.6,
		Hentai: 0.6,
		Sexy: 0.92
	};
	var modelPromise = null;

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function containsTextProfanity(value) {
		var lower = String(value || "").toLowerCase();
		for (var i = 0; i < TEXT_PROFANITY.length; i++) {
			var word = TEXT_PROFANITY[i];
			var re = new RegExp("\\b" + word.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "\\b", "i");
			if (re.test(lower)) {
				return true;
			}
		}
		return false;
	}

	function id() {
		return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
	}

	function formatDate(ts) {
		return new Date(ts).toLocaleString();
	}

	function readAsDataUrl(file) {
		return new Promise(function (resolve, reject) {
			var reader = new FileReader();
			reader.onload = function () { resolve(reader.result); };
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function loadImageFromUrl(url) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () { resolve(img); };
			img.onerror = reject;
			img.src = url;
		});
	}

	async function getNsfwModel() {
		if (!window.nsfwjs || !window.tf) {
			return null;
		}
		if (!modelPromise) {
			modelPromise = window.nsfwjs.load("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/model/").catch(function () {
				return null;
			});
		}
		return modelPromise;
	}

	async function scanImage(file) {
		if (!file) {
			return { ok: true, imageData: "" };
		}
		if (!file.type || file.type.indexOf("image/") !== 0) {
			return { ok: false, reason: "Only image uploads are allowed." };
		}
		if (file.size > MAX_IMAGE_BYTES) {
			return { ok: false, reason: "Image is too large. Max file size is 5MB." };
		}
		if (containsTextProfanity(file.name)) {
			return { ok: false, reason: "Image filename contains blocked language." };
		}

		var preview = await readAsDataUrl(file);
		var model = await getNsfwModel();
		if (!model) {
			return { ok: true, imageData: preview, warning: "Image scanner unavailable right now; text filtering still active." };
		}

		var blobUrl = URL.createObjectURL(file);
		try {
			var img = await loadImageFromUrl(blobUrl);
			var predictions = await model.classify(img);
			for (var i = 0; i < predictions.length; i++) {
				var p = predictions[i];
				if (Object.prototype.hasOwnProperty.call(NSFW_THRESHOLDS, p.className) && p.probability >= NSFW_THRESHOLDS[p.className]) {
					return { ok: false, reason: "Image blocked by safety filter (" + p.className + ")." };
				}
			}
			return { ok: true, imageData: preview };
		} catch (err) {
			return { ok: false, reason: "Could not scan image. Please try another file." };
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	}

	function isServerBoard(section) {
		return String(section.getAttribute("data-backend") || "").toLowerCase() === "server";
	}

	function getEndpoint(section, attrName, fallbackPath) {
		return section.getAttribute(attrName) || fallbackPath;
	}

	async function readJsonResponse(response) {
		var contentType = response.headers.get("content-type") || "";
		if (contentType.indexOf("application/json") === -1) {
			throw new Error("Expected JSON response.");
		}
		return response.json();
	}

	async function postJson(url, payload) {
		var response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			var message = "Request failed.";
			try {
				var errorBody = await response.json();
				message = errorBody && errorBody.error ? errorBody.error : message;
			} catch (err) {
				// keep default message
			}
			throw new Error(message);
		}
		return readJsonResponse(response);
	}

	function mountBoard(section) {
		var boardKey = section.getAttribute("data-community-board") || "default";
		var storageKey = "community-board:" + boardKey;
		var votedKey = storageKey + ":voted";
		var serverMode = isServerBoard(section);
		var liveMode = serverMode;
		var feedEndpoint = getEndpoint(section, "data-feed-endpoint", "");
		var postEndpoint = getEndpoint(section, "data-post-endpoint", "");
		var voteEndpoint = getEndpoint(section, "data-vote-endpoint", "");

		var form = section.querySelector(".community-form");
		var list = section.querySelector("[data-community-list]");
		var status = section.querySelector(".community-status");
		if (!form || !list || !status) {
			return;
		}

		function readPosts() {
			try {
				var data = localStorage.getItem(storageKey);
				return data ? JSON.parse(data) : [];
			} catch (e) {
				return [];
			}
		}

		function savePosts(posts) {
			localStorage.setItem(storageKey, JSON.stringify(posts));
		}

		function readVoted() {
			try {
				var data = localStorage.getItem(votedKey);
				return data ? JSON.parse(data) : {};
			} catch (e) {
				return {};
			}
		}

		function saveVoted(map) {
			localStorage.setItem(votedKey, JSON.stringify(map));
		}

		function loadServerPosts() {
			if (!feedEndpoint) {
				return Promise.resolve([]);
			}
			return fetch(feedEndpoint)
				.then(function (response) {
					if (!response.ok) {
						throw new Error("Could not load posts.");
					}
					return readJsonResponse(response);
				})
				.then(function (data) {
					return Array.isArray(data) ? data : (data.posts || []);
				});
		}

		function makeServerImagePayload(file) {
			return scanImage(file).then(function (result) {
				if (!result.ok) {
					throw new Error(result.reason);
				}
				return {
					imageData: result.imageData || "",
					warning: result.warning || "",
					imageName: file ? file.name : ""
				};
			});
		}

		function normalizePost(post) {
			return {
				id: post.id,
				alias: post.alias || "Anonymous",
				message: post.message || "",
				imageData: post.imageData || "",
				imageUrl: post.imageUrl || "",
				upvotes: post.upvotes || 0,
				createdAt: post.createdAt || Date.now()
			};
		}

		function render() {
			var posts = readPosts();
			posts.sort(function (a, b) {
				if ((b.upvotes || 0) !== (a.upvotes || 0)) {
					return (b.upvotes || 0) - (a.upvotes || 0);
				}
				return (b.createdAt || 0) - (a.createdAt || 0);
			});

			if (!posts.length) {
				list.innerHTML = '<p class="community-empty">No posts yet. Be the first one.</p>';
				return;
			}

			var voted = readVoted();
			var html = posts.map(function (post) {
				var votedClass = voted[post.id] ? " voted" : "";
				var imageSrc = post.imageUrl || post.imageData || "";
				var imageHtml = imageSrc ? '<img class="community-image" src="' + imageSrc + '" alt="User upload" loading="lazy" />' : "";
				return (
					'<article class="community-post" data-post-id="' + escapeHtml(post.id) + '">' +
					'<div class="community-meta">' +
					'<span>' + escapeHtml(post.alias || "Anonymous") + ' - ' + escapeHtml(formatDate(post.createdAt)) + '</span>' +
					'<button type="button" class="vote-button' + votedClass + '" data-upvote="' + escapeHtml(post.id) + '">▲ ' + (post.upvotes || 0) + '</button>' +
					'</div>' +
					'<div class="community-body">' + escapeHtml(post.message) + '</div>' +
					imageHtml +
					'</article>'
				);
			}).join("");

			list.innerHTML = html;
		}

		function renderServerPosts(posts) {
			var voted = readVoted();
			posts = (posts || []).map(normalizePost);
			posts.sort(function (a, b) {
				if ((b.upvotes || 0) !== (a.upvotes || 0)) {
					return (b.upvotes || 0) - (a.upvotes || 0);
				}
				return (b.createdAt || 0) - (a.createdAt || 0);
			});

			if (!posts.length) {
				list.innerHTML = '<p class="community-empty">No posts yet. Be the first one.</p>';
				return;
			}

			var html = posts.map(function (post) {
				var votedClass = voted[post.id] ? " voted" : "";
				var imageSrc = post.imageUrl || post.imageData || "";
				var imageHtml = imageSrc ? '<img class="community-image" src="' + escapeHtml(imageSrc) + '" alt="User upload" loading="lazy" />' : "";
				return (
					'<article class="community-post" data-post-id="' + escapeHtml(post.id) + '">' +
					'<div class="community-meta">' +
					'<span>' + escapeHtml(post.alias || "Anonymous") + ' - ' + escapeHtml(formatDate(post.createdAt)) + '</span>' +
					'<button type="button" class="vote-button' + votedClass + '" data-upvote="' + escapeHtml(post.id) + '">▲ ' + (post.upvotes || 0) + '</button>' +
					'</div>' +
					'<div class="community-body">' + escapeHtml(post.message) + '</div>' +
					imageHtml +
					'</article>'
				);
			}).join("");

			list.innerHTML = html;
		}

		async function refreshServerBoard() {
			try {
				var posts = await loadServerPosts();
				liveMode = true;
				renderServerPosts(posts);
				return true;
			} catch (err) {
				liveMode = false;
				status.textContent = "Live wall unavailable right now; using local mode until the server is started.";
				renderLocalBoard();
				return false;
			}
		}

		function renderLocalBoard() {
			render();
		}

		form.addEventListener("submit", async function (event) {
			event.preventDefault();
			status.textContent = "Checking your post...";

			var aliasInput = form.elements.alias;
			var messageInput = form.elements.message;
			var imageInput = form.elements.image;

			var alias = (aliasInput && aliasInput.value ? aliasInput.value.trim() : "") || "Anonymous";
			var message = messageInput && messageInput.value ? messageInput.value.trim() : "";
			var file = imageInput && imageInput.files ? imageInput.files[0] : null;

			if (!message) {
				status.textContent = "Please add a message before posting.";
				return;
			}
			if (containsTextProfanity(alias) || containsTextProfanity(message)) {
				status.textContent = "Post blocked: profanity detected in text.";
				return;
			}

			if (serverMode && liveMode) {
				try {
					var imagePayload = await makeServerImagePayload(file);
					var createdPost = await postJson(postEndpoint, {
						alias: alias.slice(0, 40),
						message: message.slice(0, 600),
						imageData: imagePayload.imageData || "",
						imageName: imagePayload.imageName || ""
					});
					form.reset();
					status.textContent = imagePayload.warning || "Posted. Thanks for sharing.";
					if (createdPost) {
						await refreshServerBoard();
					}
				} catch (err) {
					liveMode = false;
					status.textContent = (err.message || "Could not post right now.") + " Using local mode instead.";
					var imageResult = await scanImage(file);
					if (!imageResult.ok) {
						status.textContent = imageResult.reason;
						return;
					}
					var posts = readPosts();
					posts.push({
						id: id(),
						alias: alias.slice(0, 40),
						message: message.slice(0, 600),
						imageData: imageResult.imageData || "",
						upvotes: 0,
						createdAt: Date.now()
					});
					savePosts(posts);
					form.reset();
					status.textContent = imageResult.warning || "Posted locally. Thanks for sharing.";
					renderLocalBoard();
				}
				return;
			}

			var imageResult = await scanImage(file);
			if (!imageResult.ok) {
				status.textContent = imageResult.reason;
				return;
			}

			var posts = readPosts();
			posts.push({
				id: id(),
				alias: alias.slice(0, 40),
				message: message.slice(0, 600),
				imageData: imageResult.imageData || "",
				upvotes: 0,
				createdAt: Date.now()
			});
			savePosts(posts);

			form.reset();
			status.textContent = imageResult.warning || "Posted. Thanks for sharing.";
			renderLocalBoard();
		});

		list.addEventListener("click", function (event) {
			var button = event.target.closest("[data-upvote]");
			if (!button) {
				return;
			}

			var postId = button.getAttribute("data-upvote");
			if (!postId) {
				return;
			}

			var voted = readVoted();
			if (voted[postId]) {
				status.textContent = "You already upvoted this post from this browser.";
				return;
			}

			if (serverMode && liveMode) {
				postJson(voteEndpoint, { id: postId }).then(function () {
					voted[postId] = true;
					saveVoted(voted);
					status.textContent = "Thanks for voting.";
					refreshServerBoard();
				}).catch(function (err) {
					liveMode = false;
					status.textContent = (err.message || "Could not save your vote.") + " Using local mode instead.";
					var posts = readPosts();
					for (var i = 0; i < posts.length; i++) {
						if (posts[i].id === postId) {
							posts[i].upvotes = (posts[i].upvotes || 0) + 1;
							break;
						}
					}
					savePosts(posts);
					voted[postId] = true;
					saveVoted(voted);
					renderLocalBoard();
				});
				return;
			}

			var posts = readPosts();
			for (var i = 0; i < posts.length; i++) {
				if (posts[i].id === postId) {
					posts[i].upvotes = (posts[i].upvotes || 0) + 1;
					break;
				}
			}
			savePosts(posts);
			voted[postId] = true;
			saveVoted(voted);
			status.textContent = "Thanks for voting.";
			renderLocalBoard();
		});

		if (serverMode) {
			refreshServerBoard();
		} else {
			renderLocalBoard();
		}
	}

	document.addEventListener("DOMContentLoaded", function () {
		var sections = document.querySelectorAll("[data-community-board]");
		for (var i = 0; i < sections.length; i++) {
			mountBoard(sections[i]);
		}
	});
})();
