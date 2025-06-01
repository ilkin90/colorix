document.addEventListener("DOMContentLoaded", function () {
	// Newsletter subscription functionality
	const newsletterForm = document.getElementById("newsletterForm");
	const newsletterMessage = document.getElementById("newsletterMessage");

	if (newsletterForm) {
		newsletterForm.addEventListener("submit", function (e) {
			e.preventDefault();

			const emailInput = this.querySelector('input[type="email"]');
			const email = emailInput.value.trim();

			if (!email) {
				showNewsletterMessage(
					"Zəhmət olmasa e-poçt ünvanınızı daxil edin.",
					"error"
				);
				return;
			}

			if (!isValidEmail(email)) {
				showNewsletterMessage(
					"Zəhmət olmasa düzgün e-poçt ünvanı daxil edin.",
					"error"
				);
				return;
			}

			// Simulate newsletter subscription
			simulateNewsletterSubscription(email)
				.then(() => {
					showNewsletterMessage(
						"Uğurla abunə oldunuz! Təşəkkür edirik.",
						"success"
					);
					emailInput.value = "";
				})
				.catch(() => {
					showNewsletterMessage(
						"Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
						"error"
					);
				});
		});
	}

	// Smooth scroll for footer links
	const footerLinks = document.querySelectorAll('.footer-section a[href^="#"]');
	footerLinks.forEach((link) => {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			const targetId = this.getAttribute("href").substring(1);
			const targetElement = document.getElementById(targetId);

			if (targetElement) {
				targetElement.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		});
	});

	// Social link analytics tracking (optional)
	const socialLinks = document.querySelectorAll(".social-links a");
	socialLinks.forEach((link) => {
		link.addEventListener("click", function () {
			const platform = this.getAttribute("aria-label");
			// Add analytics tracking here if needed
			console.log(`Social link clicked: ${platform}`);
		});
	});
});

function showNewsletterMessage(message, type) {
	const messageElement = document.getElementById("newsletterMessage");
	if (messageElement) {
		messageElement.textContent = message;
		messageElement.className = `newsletter-message ${type}`;
		messageElement.style.display = "block";

		// Hide message after 5 seconds
		setTimeout(() => {
			messageElement.style.display = "none";
		}, 5000);
	}
}

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function simulateNewsletterSubscription(email) {
	return new Promise((resolve, reject) => {
		// Simulate API call delay
		setTimeout(() => {
			// Random success/failure for demo (90% success rate)
			if (Math.random() > 0.1) {
				resolve();
			} else {
				reject();
			}
		}, 1000);
	});
}
