$(document).ready(function () {

    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }

    $.validator.addMethod('strictEmail', function (value) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }, 'Please enter a structurally valid email address.');

    $('#loginForm').validate({

        rules: {
            email: {
                required: true,
                strictEmail: true
            },
            password: {
                required: true,
                minlength: 8
            }
        },

        messages: {
            email: {
                required: 'Email address is required.',
                strictEmail: 'Please enter a structurally valid email address.'
            },
            password: {
                required: 'Password is required.',
                minlength: 'Invalid credentials layout format (Minimum length is 8 characters).'
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

            const email    = $('#email').val().trim();
            const password = $('#password').val();

            $.ajax({
                url         : '/api/auth/login',
                method      : 'POST',
                contentType : 'application/json',
                data        : JSON.stringify({ email, password }),
                success: function (response) {
                    if (response.token) {
                        localStorage.clear();
                        localStorage.setItem('token', response.token);

                        const userRole = (response.user && response.user.role) || response.role || 'customer';
                        localStorage.setItem('role', userRole);

                        window.location.href = 'index.html';
                    } else {
                        $('#global-error').text('Invalid server response signature structural payload.').show();
                    }
                },
                error: function (xhr) {
                    const msg = (xhr.responseJSON && xhr.responseJSON.message)
                        ? xhr.responseJSON.message
                        : 'Authentication failed. Please check your credentials and try again.';
                    $('#global-error').text(msg).show();
                }
            });
        }
    });
});