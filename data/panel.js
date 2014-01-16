'use strict';

function refresh() {
    addon.port.emit('refresh');
}

function logout() {
    addon.port.emit('logout');
}

function passLogin(e) {
    // Prevents form submission.
    e.preventDefault();
    var login = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
    // Passes the login to the main add-on module.
    addon.port.emit('login-obtained', login);
    // Prevents form submission.
    return false;
}

addon.port.on('show-balances', function (balances) {
    document.getElementById('declining').textContent = balances.declining;
    document.getElementById('uros').textContent = balances.uros;
    document.getElementById('balances').style.display = 'block';
});

addon.port.on('hide-balances', function () {
    document.getElementById('declining').textContent = '';
    document.getElementById('uros').textContent = '';
    document.getElementById('balances').style.display = 'none';
});

addon.port.on('login-completed', function () {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

addon.port.on('show-form', function () {
    document.getElementById('login-form').style.display = 'block';
});

addon.port.on('hide-form', function () {
    document.getElementById('login-form').style.display = 'none';
});

addon.port.on('reset-password', function () {
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
});

window.onload = function () {
    // Enables the buttons.
    document.getElementById('login-form')
            .addEventListener('submit', passLogin, false);
    document.getElementById('refresh')
            .addEventListener('mouseup', refresh, false);
    document.getElementById('logout')
            .addEventListener('mouseup', logout, false);
    addon.port.emit('panel-loaded');
};
