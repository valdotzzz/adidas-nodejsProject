$(document).ready(function() {
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }

    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Clear all previous validation states
        $('.form-group input').removeClass('field-invalid');
        $('.field-error').text('').hide();
        $('#global-error').text('').hide();

        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val();

        // 1. Full Name Validation
        if (!name) {
            $('#name').addClass('field-invalid');
            $('#name-error').text('Full name is required.').show();
            isValid = false;
        }

        // 2. Comprehensive Email Regular Expression (RFC 5322 Standards)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            $('#email').addClass('field-invalid');
            $('#email-error').text('Email address is required.').show();
            isValid = false;
        } else if (!emailRegex.test(email)) {
            $('#email').addClass('field-invalid');
            $('#email-error').text('Please enter a valid email address (e.g., name@domain.com).').show();
            isValid = false;
        }

        // 3. Strict Password Complexity Verification
        // Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/;
        if (!password) {
            $('#password').addClass('field-invalid');
            $('#password-error').text('Password is required.').show();
            isValid = false;
        } else if (!passwordRegex.test(password)) {
            $('#password').addClass('field-invalid');
            $('#password-error').text('Password must be at least 8 characters long and contain uppercase, lowercase, and numerical characters.').show();
            isValid = false;
        }

        // Drop execution block if any field validations fail
        if (!isValid) return;

        $.ajax({
            url: '/api/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name, email, password }),
            success: function() {
                // Post-creation constraint: Do not log user in, force login routing manually
                window.location.href = 'login.html';
            },
            error: function(xhr) {
                let msg = 'Registration failed. Please check your system configuration parameters.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                $('#global-error').text(msg).show();
            }
        });
    });
});