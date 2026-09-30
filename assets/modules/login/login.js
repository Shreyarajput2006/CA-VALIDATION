function togglePassword() {

  const password = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');

  if (password.type === 'password') {

    password.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');

  } else {

    password.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');

  }
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) {
    alert('Please fill all fields');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const result = await res.json();
    if (res.ok) {
      localStorage.setItem('userId', result.userId);
      localStorage.setItem('name', result.name);
      alert('Login successful');
     window.location.href = '/dashboard.html';
    } else {
    alert(result.message);
    }
  } catch (error) {
    alert('Server error. Please try again.');

  }
}