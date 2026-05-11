document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("registerForm");

  const fullname = document.getElementById("fullname");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirm = document.getElementById("confirm");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearErrors();

    let isValid = true;

    // check full name
    if (fullname.value.trim() === "") {
      showError(fullname, "Full name is required.");
      isValid = false;
    }

    // check email
    if (!isValidEmail(email.value.trim())) {
      showError(email, "Please enter a valid email address.");
      isValid = false;
    }

    // check password strength
    if (!isStrongPassword(password.value.trim())) {
      showError(
        password,
        "Password must be at least 12 characters and include uppercase, lowercase, number, and special character."
      );
      isValid = false;
    }
    

    // check confirm password
    if (confirm.value.trim() !== password.value.trim()) {
      showError(confirm, "Passwords do not match.");
      isValid = false;
    }

    // submit if valid
    if (isValid) {
      // save full name for dashboard
      //localStorage.setItem("fullName", fullname.value);

      form.submit();
    }
  });

  // show error message
  function showError(input, message) {
    input.classList.add("form__input--error");

    let error = input.nextElementSibling;

    if (!error || !error.classList.contains("form__error")) {
      error = document.createElement("div");
      error.classList.add("form__error");
      input.insertAdjacentElement("afterend", error);
    }

    error.textContent = message;
  }

  // clear all errors
  function clearErrors() {
    document.querySelectorAll(".form__error").forEach(e => e.remove());

    document.querySelectorAll(".form__input").forEach(input => {
      input.classList.remove("form__input--error");
    });
  }

  // validate email
  function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  // validate password
  function isStrongPassword(password) {
    const pattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/;
    return pattern.test(password);
  }

});