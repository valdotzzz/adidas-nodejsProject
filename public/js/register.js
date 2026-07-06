$(document).ready(function () {

    // Redirect already-authenticated users
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }

    // ── Custom jQuery Validate methods ────────────────────────────────────────

    // RFC 5322-compliant email check
    $.validator.addMethod('strictEmail', function (value) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }, 'Please enter a valid email address (e.g., name@domain.com).');

    // Password complexity: min 8 chars, at least one uppercase, one lowercase, one number
    $.validator.addMethod('passwordComplexity', function (value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/.test(value);
    }, 'Password must be at least 8 characters long and contain uppercase, lowercase, and numerical characters.');

    // ── jQuery Validate initialisation ────────────────────────────────────────
    $('#registerForm').validate({

        rules: {
            name: {
                required: true
            },
            email: {
                required: true,
                strictEmail: true
            },
            password: {
                required: true,
                minlength: 8,
                passwordComplexity: true
            }
        },

        messages: {
            name: {
                required: 'Full name is required.'
            },
            email: {
                required: 'Email address is required.',
                strictEmail: 'Please enter a valid email address (e.g., name@domain.com).'
            },
            password: {
                required: 'Password is required.',
                minlength: 'Password must be at least 8 characters long.',
                passwordComplexity: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numerical characters.'
            }
        },

        // Render errors into the existing field-error divs to keep your CSS intact
        errorPlacement: function (error, element) {
            $('#' + element.attr('id') + '-error').html(error).show();
        },

        highlight: function (element) {
            $(element).addClass('field-invalid');
        },

        unhighlight: function (element) {
            $(element).removeClass('field-invalid');
            $('#' + element.id + '-error').text('').hide();
        },

        // Only fires when the form passes all rules
        submitHandler: function () {
            $('#global-error').text('').hide();

            const name     = $('#name').val().trim();
            const email    = $('#email').val().trim();
            const password = $('#password').val();

            $.ajax({
                url         : '/api/auth/register',
                method      : 'POST',
                contentType : 'application/json',
                data        : JSON.stringify({ name, email, password }),
                success: function () {
                    // Post-creation: force manual login, do not auto-authenticate
                    window.location.href = 'login.html';
                },
                error: function (xhr) {
                    const msg = (xhr.responseJSON && xhr.responseJSON.message)
                        ? xhr.responseJSON.message
                        : 'Registration failed. Please check your system configuration parameters.';
                    $('#global-error').text(msg).show();
                }
            });
        }
    });
});