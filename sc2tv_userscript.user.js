// ==UserScript==
// @name        sc2tv.ru userscript
// @namespace   http://sc2tv.ru/users/Heart
// @author      Heart
// @include     http://sc2tv.ru/*
// @version     0.0.1
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @resource    ctrldropdownmenu.css https://raw.github.com/FromHeartToSun/SC2TVUserscript/master/ctrldropdownmenu.css
// ==/UserScript==

(function() {
    var tabPreferences = (function() {
        var tabPreferences = {};
        var commit = function() {
            var result = [];
            for (var key in tabPreferences)
                if (tabPreferences.hasOwnProperty(key))
                    result.push(key + '^' + tabPreferences[key]);
            var str = result.join('|');
            GM_setValue('tab_preferences', str);
        };
        (function fetch() {
            var str = GM_getValue('tab_preferences') || '';
            str.split('|').forEach(function(preference) {
                var preferenceParts = preference.split('^');
                if (preferenceParts.length === 2)
                    tabPreferences[preferenceParts[0]] = preferenceParts[1];
            });
        })();
        return {
            preferredTab: function() {
                return tabPreferences[document.URL];
            },
            savePreference: function(tab) {
                tabPreferences[document.URL] = tab;
                commit();
            },
            clearPreference: function() {
                delete tabPreferences[document.URL];
                commit();
            }
        };
    })();

    var grabStreamTabText = function(tab) {
        return /([^(]+)(?:\(\d+\))?/.exec(tab.firstChild.textContent)[1].trim();
    };

    (function updateStreamTabs(preferredTabText) {
        var tabs = document.querySelector('#quicktabs-2 ul');
        if (!tabs)
            return;
        if (!tabs.hasChildNodes())
            return;
        var preferredTab = tabs.childNodes[0];
        var activeTab = preferredTab;
        [].slice.call(tabs.childNodes, 1).forEach(function(tab) {
            var tabText = grabStreamTabText(tab);
            if (tabText === preferredTabText)
                preferredTab = tab;
            if (tab.classList.contains('active'))
                activeTab = tab;
        });
        if (preferredTab != activeTab) {
            activeTab.classList.remove('active');
            preferredTab.classList.add('active');
        }
    })(tabPreferences.preferredTab());

    (function prepareCtrlDropdownMenu() {
        GM_addStyle(GM_getResourceText('ctrldropdownmenu.css'));

        var ctrlHeld = false;
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Control') {
                if (!ctrlHeld)
                    [].forEach.call(document.getElementsByClassName('ctrl-dropdown-menu'), function(menu) {
                        menu.classList.add('enabled');
                    });
                ctrlHeld = true;
            }

        });
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Control') {
                if (ctrlHeld)
                    [].forEach.call(document.getElementsByClassName('ctrl-dropdown-menu'), function(menu) {
                        menu.classList.remove('enabled');
                    });
                ctrlHeld = false;
            }
        });
    })();

    (function injectStreamCtrlDropdownMenu(eraseOld) {
        var createCtrlDropdownMenu = function(items) {
            var menu = document.createElement('ul');
            menu.className = 'ctrl-dropdown-menu';
            items.forEach(function(item) {
                var menuItem = document.createElement('li');
                menuItem.className = 'ctrl-dropdown-menu-item';
                menuItem.appendChild(document.createTextNode(item.text));
                menuItem.addEventListener('click', item.action, false);
                menu.appendChild(menuItem);
            });
            return menu;
        };
        var createCtrlDropdownMenuItem = function(text, action) {
            return {
                text: text,
                action: action
            };
        };
        var createOpenCtrlDropdownMenuItem = function(tabText) {
            return createCtrlDropdownMenuItem('Открывать по умолчанию', function() {
                tabPreferences.savePreference(tabText);
                injectStreamCtrlDropdownMenu(true);
            });
        };
        var createClearCtrlDropdownMenuItem = function() {
            return createCtrlDropdownMenuItem('Очистить выбор', function() {
                tabPreferences.clearPreference();
                injectStreamCtrlDropdownMenu(true);
            });
        };

        var preferredTabText = tabPreferences.preferredTab();
        var tabs = document.querySelector('#quicktabs-2 ul');
        if (!tabs)
            return;
        [].forEach.call(tabs.childNodes, function(tab) {
            if (eraseOld)
                if (tab.lastChild.classList.contains('ctrl-dropdown-menu'))
                    tab.removeChild(tab.lastChild);
            var tabText = grabStreamTabText(tab);
            tab.appendChild(createCtrlDropdownMenu([
                preferredTabText === tabText ?
                createClearCtrlDropdownMenuItem() :
                createOpenCtrlDropdownMenuItem(tabText)
            ]));
        });
    })();
})();
