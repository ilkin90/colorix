document.addEventListener("DOMContentLoaded", function () {
	// Tab switching functionality
	const tabBtns = document.querySelectorAll(".tab-btn");
	const authForms = document.querySelectorAll(".auth-form");
	const switchFormLinks = document.querySelectorAll(".switch-form");

	// Handle tab button clicks
	tabBtns.forEach((btn) => {
		btn.addEventListener("click", function () {
			const targetTab = this.getAttribute("data-tab");
			switchToTab(targetTab);
		});
	});

	// Handle switch form links
	switchFormLinks.forEach((link) => {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			const targetTab = this.getAttribute("data-target");
			switchToTab(targetTab);
		});
	});

	function switchToTab(tabName) {
		// Update tab buttons
		tabBtns.forEach((btn) => {
			btn.classList.remove("active");
			if (btn.getAttribute("data-tab") === tabName) {
				btn.classList.add("active");
			}
		});

		// Update forms
		authForms.forEach((form) => {
			form.classList.remove("active");
			if (form.id === tabName) {
				form.classList.add("active");
			}
		});

		// Clear any previous messages
		hideMessage();
	}

	// Sign in form handling
	const signinForm = document.getElementById("signinForm");
	if (signinForm) {
		signinForm.addEventListener("submit", function (e) {
			e.preventDefault();

			const formData = new FormData(signinForm);
			const email = formData.get("email");
			const password = formData.get("password");

			// Basic validation
			if (!email || !password) {
				showMessage("Zəhmət olmasa, bütün sahələri doldurun.", "error");
				return;
			}

			if (!isValidEmail(email)) {
				showMessage("Zəhmət olmasa, düzgün e-poçt ünvanı daxil edin.", "error");
				return;
			}

			// Simulate sign in process
			showMessage("Daxil olunur...", "success");

			setTimeout(() => {
				// Simulate successful login
				showMessage("Uğurla daxil oldunuz! Yönləndirilirsiz...", "success");

				// Store login state (in real app, this would be handled by backend)
				localStorage.setItem(
					"colorix_user",
					JSON.stringify({
						email: email,
						loginTime: new Date().toISOString(),
					})
				);

				// Redirect to main page after 1.5 seconds
				setTimeout(() => {
					window.location.href = "index.html";
				}, 1500);
			}, 1000);
		});
	}

	// Sign up form handling
	const signupForm = document.getElementById("signupForm");
	if (signupForm) {
		signupForm.addEventListener("submit", function (e) {
			e.preventDefault();

			const formData = new FormData(signupForm);
			const name = formData.get("name");
			const email = formData.get("email");
			const password = formData.get("password");
			const confirmPassword = formData.get("confirmPassword");
			const agreeTerms = document.getElementById("agree-terms").checked;

			// Validation
			if (!name || !email || !password || !confirmPassword) {
				showMessage("Zəhmət olmasa, bütün sahələri doldurun.", "error");
				return;
			}

			if (!isValidEmail(email)) {
				showMessage("Zəhmət olmasa, düzgün e-poçt ünvanı daxil edin.", "error");
				return;
			}

			if (password.length < 6) {
				showMessage("Şifrə ən azı 6 simvoldan ibarət olmalıdır.", "error");
				return;
			}

			if (password !== confirmPassword) {
				showMessage("Şifrələr uyğun gəlmir.", "error");
				return;
			}

			if (!agreeTerms) {
				showMessage("İstifadə şərtlərini qəbul etməlisiniz.", "error");
				return;
			}

			// Simulate sign up process
			showMessage("Hesab yaradılır...", "success");

			setTimeout(() => {
				// Simulate successful registration
				showMessage("Hesabınız uğurla yaradıldı! Daxil olun.", "success");

				// Clear form and switch to sign in
				signupForm.reset();

				setTimeout(() => {
					switchToTab("signin");
					// Pre-fill email in sign in form
					document.getElementById("signin-email").value = email;
				}, 1500);
			}, 1500);
		});
	}

	// Password strength indicator for signup
	const signupPassword = document.getElementById("signup-password");
	if (signupPassword) {
		signupPassword.addEventListener("input", function () {
			const password = this.value;
			const strength = calculatePasswordStrength(password);
			updatePasswordStrengthUI(this, strength);
		});
	}

	// Utility functions
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function calculatePasswordStrength(password) {
		let strength = 0;
		if (password.length >= 6) strength++;
		if (password.length >= 8) strength++;
		if (/[A-Z]/.test(password)) strength++;
		if (/[0-9]/.test(password)) strength++;
		if (/[^A-Za-z0-9]/.test(password)) strength++;
		return strength;
	}

	function updatePasswordStrengthUI(input, strength) {
		// Remove existing strength indicator
		const existingIndicator =
			input.parentNode.querySelector(".password-strength");
		if (existingIndicator) {
			existingIndicator.remove();
		}

		if (input.value.length > 0) {
			const strengthIndicator = document.createElement("div");
			strengthIndicator.className = "password-strength";

			let strengthText = "Zəif";
			let strengthColor = "#f44336";

			if (strength >= 3) {
				strengthText = "Orta";
				strengthColor = "#ff9800";
			}
			if (strength >= 4) {
				strengthText = "Güclü";
				strengthColor = "#4caf50";
			}

			strengthIndicator.innerHTML = `
				<div style="margin-top: 5px; font-size: 0.8rem; color: ${strengthColor};">
					Şifrə gücü: ${strengthText}
				</div>
			`;

			input.parentNode.appendChild(strengthIndicator);
		}
	}

	function showMessage(text, type) {
		const messageEl = document.getElementById("authMessage");
		if (messageEl) {
			messageEl.textContent = text;
			messageEl.className = `auth-message ${type}`;
			messageEl.style.display = "block";

			// Auto-hide success messages after 3 seconds
			if (type === "success") {
				setTimeout(() => {
					hideMessage();
				}, 3000);
			}
		}
	}

	function hideMessage() {
		const messageEl = document.getElementById("authMessage");
		if (messageEl) {
			messageEl.style.display = "none";
		}
	}

	// Check if user is already logged in
	const existingUser = localStorage.getItem("colorix_user");
	if (existingUser) {
		try {
			const userData = JSON.parse(existingUser);
			const loginTime = new Date(userData.loginTime);
			const now = new Date();
			const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

			// If logged in within last 24 hours, show welcome message
			if (hoursDiff < 24) {
				showMessage(`Xoş gəlmisiniz, ${userData.email}!`, "success");
			}
		} catch (e) {
			// Invalid stored data, remove it
			localStorage.removeItem("colorix_user");
		}
	}
});
// Hamburger menyu üçün toggle funksiyası
const toggleBtn = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

toggleBtn.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});
