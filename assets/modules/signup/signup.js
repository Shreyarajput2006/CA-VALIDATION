function togglePassword(inputId, eyeId) {

  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);

  if (input.type === "password") {
    input.type = "text";
    eye.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    eye.classList.replace("fa-eye-slash", "fa-eye");
  }
}

async function signup() {

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (!name || !email || !password || !confirmPassword) {
    alert('Please fill all fields');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {

    const res = await fetch('/api/auth/signup', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        name,
        email,
        password
      })

    });

    const result = await res.json();

    if (res.ok) {

      alert('Signup successful');

      window.location.href = '/login.html';

    } else {

      alert(result.message);

    }

  } catch (error) {

    alert('Server error. Please try again.');

  }

}