// login.js

// 1. Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  form.addEventListener('submit', (event) => {
    // Stop the form from submitting by default
    event.preventDefault();

    // Clear previous errors
    clearErrors();

    let isValid = true;

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    // 2. Validate email
    if (emailValue === '') {
      showError(emailInput, emailError, 'Email is required.');
      isValid = false;
    } else if (!isValidEmail(emailValue)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    }

    // 3. Validate password (12+ chars, upper, lower, digit, special)
    if (passwordValue === '') {
      showError(passwordInput, passwordError, 'Password is required.');
      isValid = false;
    } else if (!isStrongPassword(passwordValue)) {
      showError(
        passwordInput,
        passwordError,
        'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.'
      );
      isValid = false;
    }

    // 4. If everything is valid, submit form to server
    if (isValid) {
      // submit form to backend
      form.submit();
    }
  });

  // Helper: clear all errors
  function clearErrors() {
    emailError.textContent = '';
    passwordError.textContent = '';

    emailInput.classList.remove('form__input--error');
    passwordInput.classList.remove('form__input--error');
  }

  // Helper: show error for a specific field
  function showError(inputElement, errorElement, message) {
    inputElement.classList.add('form__input--error');
    errorElement.textContent = message;
  }

  // Helper: basic email validation
  function isValidEmail(email) {
    // Simple email regex (good enough for assignment)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Helper: strong password validation
  function isStrongPassword(password) {
    // At least 12 chars, one lower, one upper, one digit, one special
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/;
    return pattern.test(password);
  }
});