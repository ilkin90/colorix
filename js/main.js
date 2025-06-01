document.querySelector(".show-btn").addEventListener("click", function () {
	window.location.href = "https://www.artbreeder.com/";
});
document.getElementById("openEditor").addEventListener("click", function () {
	window.location.href = "create.html";
});
document.getElementById("startTrial").addEventListener("click", function () {
	window.location.href = "premium.html";
});

// Contact form handling
document.addEventListener("DOMContentLoaded", function () {
	const contactForm = document.getElementById("contactForm");
	const formMessage = document.getElementById("formMessage");

	if (contactForm) {
		contactForm.addEventListener("submit", function (e) {
			e.preventDefault();

			// Get form data
			const formData = new FormData(contactForm);
			const name = formData.get("name");
			const email = formData.get("email");
			const subject = formData.get("subject");
			const message = formData.get("message");

			// Simple validation
			if (!name || !email || !subject || !message) {
				showMessage(
					"Zəhmət olmasa, bütün tələb olunan sahələri doldurun.",
					"error"
				);
				return;
			}

			// Simulate form submission
			showMessage(
				"Mesajınız üçün təşəkkür edirik! Tezliklə sizinlə əlaqə saxlayacağıq.",
				"success"
			);
			contactForm.reset();
		});
	}

	function showMessage(text, type) {
		if (formMessage) {
			formMessage.textContent = text;
			formMessage.className = `form-message ${type}`;
			formMessage.style.display = "block";

			// Hide message after 5 seconds
			setTimeout(() => {
				formMessage.style.display = "none";
			}, 5000);
		}
	}

	// Check for user authentication status
	checkAuthStatus();
});

// Authentication status checker
function checkAuthStatus() {
	const userDataStr = localStorage.getItem("colorix_user");
	if (userDataStr) {
		try {
			const userData = JSON.parse(userDataStr);
			const loginTime = new Date(userData.loginTime);
			const now = new Date();
			const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

			// If logged in within last 24 hours, update navigation
			if (hoursDiff < 24) {
				updateNavForLoggedInUser(userData.email);
			} else {
				// Session expired, remove stored data
				localStorage.removeItem("colorix_user");
			}
		} catch (e) {
			// Invalid stored data, remove it
			localStorage.removeItem("colorix_user");
		}
	}
}

// Update navigation for logged in user
function updateNavForLoggedInUser(email) {
	const authLink = document.querySelector('a[href="auth.html"]');
	if (authLink) {
		// Create dropdown for user menu
		const userMenu = document.createElement("div");
		userMenu.className = "user-menu";
		userMenu.innerHTML = `
			<span class="user-email">${email.split("@")[0]}</span>
			<div class="user-dropdown">
				<a href="#" onclick="logout()">Çıxış</a>
			</div>
		`;

		// Replace auth link with user menu
		authLink.parentNode.replaceChild(userMenu, authLink);

		// Add styles for user menu
		const style = document.createElement("style");
		style.textContent = `
			.user-menu {
				position: relative;
				cursor: pointer;
			}
			.user-email {
				color: #fff;
				font-weight: 500;
				padding: 8px 12px;
				border-radius: 20px;
				background: rgba(156, 39, 176, 0.2);
			}
			.user-dropdown {
				display: none;
				position: absolute;
				top: 100%;
				right: 0;
				background: #fff;
				border-radius: 8px;
				box-shadow: 0 5px 15px rgba(0,0,0,0.2);
				min-width: 120px;
				z-index: 1000;
			}
			.user-menu:hover .user-dropdown {
				display: block;
			}
			.user-dropdown a {
				display: block;
				padding: 10px 15px;
				color: #333;
				text-decoration: none;
				border-radius: 8px;
			}
			.user-dropdown a:hover {
				background: #f5f5f5;
			}
		`;
		document.head.appendChild(style);
	}
}

// Logout function
function logout() {
	localStorage.removeItem("colorix_user");
	window.location.reload();
}

// Color palette interaction
document.addEventListener("DOMContentLoaded", function () {
	// Color palette functionality
	setupColorPalettes();

	// Website item click handlers
	setupWebsiteItems();

	// Newsletter form
	setupNewsletterForm();
});

// Color palette setup
function setupColorPalettes() {
	const colorBoxes = document.querySelectorAll(".color-box");

	colorBoxes.forEach((box) => {
		box.addEventListener("click", function () {
			const color = window.getComputedStyle(this).backgroundColor;
			copyToClipboard(rgbToHex(color));
			showColorCopyMessage(this, rgbToHex(color));
		});
	});
}

// Convert RGB to HEX
function rgbToHex(rgb) {
	const rgbMatch = rgb.match(/\d+/g);
	if (!rgbMatch) return rgb;

	const hex = rgbMatch.map((x) => {
		const hexValue = parseInt(x).toString(16);
		return hexValue.length === 1 ? "0" + hexValue : hexValue;
	});

	return "#" + hex.join("").toUpperCase();
}

// Copy to clipboard
function copyToClipboard(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text);
	} else {
		// Fallback for older browsers
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	}
}

// Show color copy message
function showColorCopyMessage(element, color) {
	const message = document.createElement("div");
	message.textContent = `${color} kopyalandı!`;
	message.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(156, 39, 176, 0.9);
		color: white;
		padding: 10px 15px;
		border-radius: 5px;
		z-index: 1000;
		font-size: 0.9rem;
		font-weight: 500;
	`;

	document.body.appendChild(message);

	setTimeout(() => {
		document.body.removeChild(message);
	}, 2000);
}

// Website items click handlers
function setupWebsiteItems() {
	const websiteItems = document.querySelectorAll(".website-item");
	const websiteUrls = {
		Dribbble: "https://dribbble.com/",
		Behance: "https://www.behance.net/",
		Awwwards: "https://www.awwwards.com/",
		Unsplash: "https://unsplash.com/",
	};

	websiteItems.forEach((item) => {
		item.addEventListener("click", function () {
			const websiteName = this.querySelector("h3").textContent;
			const url = websiteUrls[websiteName];
			if (url) {
				window.open(url, "_blank");
			}
		});
	});
}

// Newsletter form setup
function setupNewsletterForm() {
	const newsletterForm = document.getElementById("newsletterForm");
	const newsletterMessage = document.getElementById("newsletterMessage");

	if (newsletterForm) {
		newsletterForm.addEventListener("submit", function (e) {
			e.preventDefault();

			const email = this.querySelector('input[type="email"]').value;

			if (!email) {
				showNewsletterMessage(
					"Zəhmət olmasa, e-poçt ünvanınızı daxil edin.",
					"error"
				);
				return;
			}

			// Simulate newsletter subscription
			showNewsletterMessage(
				"Uğurla abunə oldunuz! Təşəkkür edirik.",
				"success"
			);
			this.reset();
		});
	}

	function showNewsletterMessage(text, type) {
		if (newsletterMessage) {
			newsletterMessage.textContent = text;
			newsletterMessage.className = `newsletter-message ${type}`;
			newsletterMessage.style.display = "block";

			setTimeout(() => {
				newsletterMessage.style.display = "none";
			}, 5000);
		}
	}
}
