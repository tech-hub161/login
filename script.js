document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Check if a user has already logged in on this device
    if (localStorage.getItem('loggedIn') === 'true') {
        window.location.href = 'under_construction.html';
        return;
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Default credentials
        const defaultUsername = 'admin';
        const defaultPassword = 'admin';

        if (username === defaultUsername && password === defaultPassword) {
            // Successful login
            localStorage.setItem('loggedIn', 'true'); // Mark as logged in
            window.location.href = 'under_construction.html';
        } else {
            // Failed login
            errorMessage.textContent = 'Invalid username or password.';
            errorMessage.classList.add('show');
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    });
});
