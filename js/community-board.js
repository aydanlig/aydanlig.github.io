/* =========================================================
   community-board.js – the "Advice and ideas board" (support-free page)

   HOW IT WORKS (no own server needed):
   - Posts are stored in a free Supabase database (see setup/supabase-board.md).
   - New posts are HIDDEN until you approve them in the Supabase dashboard
     (tick "approved"). Only approved posts are shown on the website.
   - Every new post also emails you (via formsubmit.co), so you know there is
     something to approve.
   - As long as Supabase is not set up yet, posts are only emailed to you
     and visitors are told honestly that their post was sent.

   SETTINGS live on the <section data-community-board ...> tag in the HTML:
     data-supabase-url   e.g. https://abcd1234.supabase.co
     data-supabase-key   the public "anon" / "publishable" key (safe to publish)
     data-notify-email   where new posts are emailed to
   ========================================================= */
(function () {
	"use strict";

	var TEXT_PROFANITY = [
		"fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy",
		"nigger", "faggot", "slut", "whore", "motherfucker", "retard"
	];
	var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
	var MAX_IMAGE_SIDE = 800; // images are shrunk to max 800px before saving
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

	function formatDate(ts) {
		return new Date(ts).toLocaleString();
	}

	function loadScript(src) {
		return new Promise(function (resolve, reject) {
			var s = document.createElement("script");
			s.src = src;
			s.onload = resolve;
			s.onerror = reject;
			document.head.appendChild(s);
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

	// The image safety scanner (~2 MB) is only downloaded when someone attaches an image
	async function getNsfwModel() {
		if (!modelPromise) {
			modelPromise = loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js")
				.then(function () { return loadScript("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js"); })
				.then(function () { return window.nsfwjs.load("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/model/"); })
				.catch(function () { return null; });
		}
		return modelPromise;
	}

	// Shrink an image to max 800px and turn it into a small JPEG (about 50–150 KB)
	function shrinkImage(img) {
		var scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
		var canvas = document.createElement("canvas");
		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);
		canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", 0.8);
	}

	// Checks an image for nudity and returns a shrunk version: { ok, imageData, reason }
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

		var blobUrl = URL.createObjectURL(file);
		try {
			var img = await loadImageFromUrl(blobUrl);
			var model = await getNsfwModel();
			if (model) {
				var predictions = await model.classify(img);
				for (var i = 0; i < predictions.length; i++) {
					var p = predictions[i];
					if (Object.prototype.hasOwnProperty.call(NSFW_THRESHOLDS, p.className) && p.probability >= NSFW_THRESHOLDS[p.className]) {
						return { ok: false, reason: "Image blocked by safety filter (" + p.className + ")." };
					}
				}
			}
			// Without the scanner the image is still reviewed by you before it appears
			return { ok: true, imageData: shrinkImage(img) };
		} catch (err) {
			return { ok: false, reason: "Could not read this image. Please try another file." };
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	}

	/* ---------- Supabase (database) ---------- */

	function supabaseHeaders(key) {
		var headers = { "apikey": key, "Content-Type": "application/json" };
		// Old-style "anon" keys are JWTs (start with "eyJ") and also go in the Authorization header
		if (key.indexOf("eyJ") === 0) {
			headers.Authorization = "Bearer " + key;
		}
		return headers;
	}

	async function fetchOk(url, options) {
		var response = await fetch(url, options);
		if (!response.ok) {
			throw new Error("Request failed (" + response.status + ").");
		}
		return response;
	}

	/* ---------- Email notification (formsubmit.co) ---------- */

	function notifyByEmail(email, boardKey, alias, message, hasImage) {
		if (!email) {
			return Promise.resolve();
		}
		return fetchOk("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
			method: "POST",
			headers: { "Content-Type": "application/json", "Accept": "application/json" },
			body: JSON.stringify({
				_subject: "New board post (" + boardKey + ") – waiting for approval",
				_template: "table",
				Name: alias,
				Message: message,
				Image: hasImage ? "yes (see Supabase)" : "no"
			})
		});
	}

	function mountBoard(section) {
		var boardKey = section.getAttribute("data-community-board") || "default";
		var votedKey = "community-board:" + boardKey + ":voted";
		var dbUrl = (section.getAttribute("data-supabase-url") || "").replace(/\/+$/, "");
		var dbKey = section.getAttribute("data-supabase-key") || "";
		var notifyEmail = section.getAttribute("data-notify-email") || "";
		var hasDatabase = Boolean(dbUrl && dbKey);

		var form = section.querySelector(".community-form");
		var list = section.querySelector("[data-community-list]");
		var status = section.querySelector(".community-status");
		if (!form || !list || !status) {
			return;
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
			try {
				localStorage.setItem(votedKey, JSON.stringify(map));
			} catch (e) {
				// voting still works, it just isn't remembered
			}
		}

		function renderPosts(posts) {
			if (!posts.length) {
				list.innerHTML = '<p class="community-empty">No posts yet. Be the first one.</p>';
				return;
			}
			var voted = readVoted();
			list.innerHTML = posts.map(function (post) {
				var votedClass = voted[post.id] ? " voted" : "";
				var imageHtml = post.image_data
					? '<img class="community-image" src="' + escapeHtml(post.image_data) + '" alt="User upload" loading="lazy" />'
					: "";
				return (
					'<article class="community-post" data-post-id="' + escapeHtml(post.id) + '">' +
					'<div class="community-meta">' +
					'<span>' + escapeHtml(post.alias || "Anonymous") + ' - ' + escapeHtml(formatDate(post.created_at)) + '</span>' +
					'<button type="button" class="vote-button' + votedClass + '" data-upvote="' + escapeHtml(post.id) + '">▲ ' + (post.upvotes || 0) + '</button>' +
					'</div>' +
					'<div class="community-body">' + escapeHtml(post.message) + '</div>' +
					imageHtml +
					'</article>'
				);
			}).join("");
		}

		async function loadPosts() {
			if (!hasDatabase) {
				list.innerHTML = '<p class="community-empty">The public board is coming soon. You can already send a post – Aydan reads every one.</p>';
				return;
			}
			try {
				// Only approved posts are returned (the database itself enforces this)
				var url = dbUrl + "/rest/v1/board_posts?select=id,alias,message,image_data,upvotes,created_at" +
					"&board=eq." + encodeURIComponent(boardKey) + "&order=upvotes.desc,created_at.desc&limit=100";
				var response = await fetchOk(url, { headers: supabaseHeaders(dbKey) });
				renderPosts(await response.json());
			} catch (err) {
				list.innerHTML = '<p class="community-empty">The board could not be loaded right now. Please try again later.</p>';
			}
		}

		form.addEventListener("submit", async function (event) {
			event.preventDefault();
			status.textContent = "Checking your post...";

			var alias = (form.elements.alias && form.elements.alias.value.trim()) || "Anonymous";
			var message = form.elements.message ? form.elements.message.value.trim() : "";
			var file = form.elements.image && form.elements.image.files ? form.elements.image.files[0] : null;

			if (!message) {
				status.textContent = "Please add a message before posting.";
				return;
			}
			if (containsTextProfanity(alias) || containsTextProfanity(message)) {
				status.textContent = "Post blocked: profanity detected in text.";
				return;
			}

			var imageResult = await scanImage(file);
			if (!imageResult.ok) {
				status.textContent = imageResult.reason;
				return;
			}

			alias = alias.slice(0, 40);
			message = message.slice(0, 600);
			status.textContent = "Sending...";

			try {
				if (hasDatabase) {
					await fetchOk(dbUrl + "/rest/v1/board_posts", {
						method: "POST",
						headers: Object.assign(supabaseHeaders(dbKey), { "Prefer": "return=minimal" }),
						body: JSON.stringify({
							board: boardKey,
							alias: alias,
							message: message,
							image_data: imageResult.imageData || null
						})
					});
					// The email is just a heads-up; the post is already saved if this fails
					notifyByEmail(notifyEmail, boardKey, alias, message, Boolean(imageResult.imageData)).catch(function () { });
					status.textContent = "Thanks! Your post will appear here once Aydan has approved it.";
				} else {
					await notifyByEmail(notifyEmail, boardKey, alias, message, Boolean(imageResult.imageData));
					status.textContent = "Thanks! Your post was sent to Aydan.";
				}
				form.reset();
			} catch (err) {
				status.textContent = "Could not send your post right now. Please try again later or email aydan@smileyfoxyportraits.com.";
			}
		});

		list.addEventListener("click", async function (event) {
			var button = event.target.closest("[data-upvote]");
			if (!button || !hasDatabase) {
				return;
			}
			var postId = button.getAttribute("data-upvote");
			var voted = readVoted();
			if (voted[postId]) {
				status.textContent = "You already upvoted this post from this browser.";
				return;
			}
			try {
				await fetchOk(dbUrl + "/rest/v1/rpc/upvote_post", {
					method: "POST",
					headers: supabaseHeaders(dbKey),
					body: JSON.stringify({ post_id: postId })
				});
				voted[postId] = true;
				saveVoted(voted);
				status.textContent = "Thanks for voting.";
				loadPosts();
			} catch (err) {
				status.textContent = "Could not save your vote right now.";
			}
		});

		loadPosts();
	}

	document.addEventListener("DOMContentLoaded", function () {
		var sections = document.querySelectorAll("[data-community-board]");
		for (var i = 0; i < sections.length; i++) {
			mountBoard(sections[i]);
		}
	});
})();
