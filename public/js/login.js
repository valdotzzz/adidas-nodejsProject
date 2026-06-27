$(document).ready(function() {
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;

        // Clear all previous states
        $('.form-group input').removeClass('field-invalid');
        $('.field-error').text('').hide();
        $('#global-error').text('').hide();

        const email = $('#email').val().trim();
        const password = $('#password').val();

        // 1. Email Regex Structural Check
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            $('#email').addClass('field-invalid');
            $('#email-error').text('Email address is required.').show();
            isValid = false;
        } else if (!emailRegex.test(email)) {
            $('#email').addClass('field-invalid');
            $('#email-error').text('Please enter a structurally valid email address.').show();
            isValid = false;
        }

        // 2. Strict Length and Format Verification Checked Pre-parsing Execution
        if (!password) {
            $('#password').addClass('field-invalid');
            $('#password-error').text('Password is required.').show();
            isValid = false;
        } else if (password.length < 8) {
            $('#password').addClass('field-invalid');
            $('#password-error').text('Invalid credentials layout format (Minimum length is 8 characters).').show();
            isValid = false;
        }

        if (!isValid) return;

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function(response) {
                if (response.token) {
                    // 1. Clear out any old session info first
                    localStorage.clear();

                    // 2. Save the fresh authentication token
                    localStorage.setItem('token', response.token);
                    
                    // 3. Extract and save the role from inside the user object
                    if (response.user && response.user.role) {
                        localStorage.setItem('role', response.user.role);
                    } else {
                        // Safe fallback check just in case it ever changes
                        localStorage.setItem('role', response.role || 'customer');
                    }

                    // 4. Redirect to the main site index
const userRole = (response.user && response.user.role) || response.role || 'customer';

if (userRole === 'admin' || userRole === 'staff') {
    window.location.href = 'admin/dashboard.html';
} else {
    window.location.href = 'index.html';
}                } else {
                    $('#global-error').text('Invalid server response signature structural payload.').show();
                }
            },
            error: function(xhr) {
                let msg = 'Authentication failed. Please check your credentials and try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                $('#global-error').text(msg).show();
            }
        });
    });
});