/*
Copyright 2013, 2014 Xinran Li.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// main.js -- the main add-on module.

// Imports the required Mozilla Add-on APIs.
var base64 = require('sdk/base64'),
    data = require('sdk/self').data,
    Panel = require('sdk/panel').Panel,
    Request = require('sdk/request').Request,
    Widget = require('sdk/widget').Widget;

// Exports the main module.
exports.main = function () {
    'use strict';

    var URLS = {
        blackboardLogin: 'https://my.rochester.edu/webapps/login/',
        blackboardLogout: 'https://my.rochester.edu/webapps/login/?action=logout',
        sequoiaToken: 'https://my.rochester.edu/webapps/bb-ecard-sso-bb_bb60/token.jsp',
        sequoiaLogin: 'https://ecard.sequoiars.com/eCardServices/AuthenticationHandler.ashx',
        sequoiaBalances: 'https://ecard.sequoiars.com/eCardServices/eCardServices.svc/WebHttp/GetAccountHolderInformationForCurrentUser'
    };

    // Creates the panel to be opened from the widget.
    var panel = new Panel({
        width: 192,
        height: 144,
        contentURL: data.url('panel.html')
    });

    // Creates a button on the add-on bar.
    new Widget({
        label: 'View yoUR balances',
        id: 'ur-balances',
        contentURL: 'http://my.rochester.edu/ui/bb-icon2.ico',
        panel: panel
    });

    // Passes balances to the panel page.
    function showBalances(response) {
        var accounts = response.json.d._ItemList;
        var balances = {
            uros: accounts[0].BalanceInDollars,
            declining: accounts[1].BalanceInDollars
        };
        panel.port.emit('show-balances', balances);
    }

    // Gets balances from Sequoia.
    function getBalances() {
        new Request({
            url: URLS.sequoiaBalances,
            onComplete: showBalances
        }).post();
    }

    // Logs in to Sequoia using a given authentication token.
    function logInToSequoia(token) {
        new Request({
            url: URLS.sequoiaLogin,
            content: {
                AUTHENTICATIONTOKEN: token
            },
            onComplete: getBalances
        }).post();
    }

    // Extracts the token.
    function parseSequoiaToken(response) {
        var r = response.text;
        var i = r.indexOf('"AUTHENTICATIONTOKEN"') + 29;
        return r.substring(i, i + 108);
    }

    // Gets the page that contains the token.
    function getSequoiaToken() {
        new Request({
            url: URLS.sequoiaToken,
            onComplete: function (response) {
                logInToSequoia(parseSequoiaToken(response));
            }
        }).get();
    }

    // Checks if the login is correct.
    function checkLogin(response) {
        if (response.text.indexOf('loginErrorMessage') !== -1) {
            panel.port.emit('show-form');
            panel.port.emit('reset-password');
            return;
        }
        panel.port.emit('login-completed');
        getSequoiaToken();
    }

    // Tries to log in to Blackboard using the obtained login.
    function logInToBlackboard(login) {
        new Request({
            url: URLS.blackboardLogin,
            content: {
                user_id: login.username,
                encoded_pw: base64.encode(login.password),
                encoded_pw_unicode: '.'
            },
            onComplete: checkLogin
        }).post();
    }

    panel.port.on('panel-loaded', function () {
        panel.port.emit('show-form');
    });

    // Tries to log in to Blackboard when the login is obtained.
    panel.port.on('login-obtained', function (login) {
        panel.port.emit('hide-form');
        logInToBlackboard(login);
    });

    // Updates balances.
    panel.port.on('refresh', function () {
        panel.port.emit('hide-balances');
        getBalances();
    });

    // Logs the user out from Blackboard.
    panel.port.on('logout', function () {
        panel.port.emit('hide-balances');
        new Request({
            url: URLS.blackboardLogout
        }).get();
        panel.port.emit('show-form');
    });
};
