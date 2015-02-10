/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function(require, exports, module) {
    var EasyComplete = require('/js/common/easycomplete');
    var util = require('/js/common/util');
    var storage = require('/js/common/storage');
    var CONST = require('/js/common/const');
    var regValidExpress = /^(==|~=|&&|\|\||[0-9]|[\+\-\*\/\^\.%, ""]|[\(\)\|\!\[\]])+$/;

    var plugins = {
        tab: require('/js/plugins/tab'),
        on: require('/js/plugins/on'),
        off: require('/js/plugins/off'),
        del: require('/js/plugins/del'),
        run: require('/js/plugins/run'),
        his: require('/js/plugins/his'),
        bm: require('/js/plugins/bookmark'),
        yd: require('/js/plugins/yd'),
        todo: require('/js/plugins/todo'),
        po: require('/js/plugins/pocket'),
        calc: require('/js/plugins/calculate')

    };
    // TODO: optionson
    // delete plugins[xx, xx, xx]

    var cmdbox;

    function findMatchPlugins(query) {
        var items = [];
        for (var key in plugins) {
            if (key.indexOf(query) !== -1) {
                items.push({
                    key: key,
                    title: plugins[key].title || '',
                    subtitle: plugins[key].subtitle || ''
                });
            }
        }

        return items;
    }

    function matchPlugins(query) {
        var items = findMatchPlugins(query);

        this.showItemList(items, function(index, item) {
            var html = [
                '<div data-type="plugins" data-index="' + index + '" data-id="' + item.key + '" class="ec-item">',
                '<span class="ec-plugin-name">' + item.key + '</span>',
                '<span class="ec-plugin-title">' + item.title + '</span>',
                '<span class="ec-plugin-subtitle">' + item.subtitle + '</span>',
                '</div>'
            ];

            if (index <= 8) {
                var tipHtml = '<div class="ec-item-tip">' + (util.isMac ? 'CTRL' : 'ALT') + ' + ' + (index + 1) + '</div>';
                html.splice(html.length - 2, 0, tipHtml);
            }

            return html.join('');
        });
    }

    function init() {
        $('.cmdbox').focus();

        cmdbox = new EasyComplete({
            id: 'cmdbox',
            onInput: function(str) {
                if (!str) {
                    this.empty();

                    return;
                }

                this.str = str;
                this.cmd = '';
                this.query = '';

                if (regValidExpress.test(str)) {
                    this.cmd = 'calc';
                    storage.h5.set(CONST.LAST_CMD, str);

                    return plugins.calc.onInput.call(this, str);
                }

                if (str.indexOf(' ') === -1) {
                    return matchPlugins.call(this, str);
                }

                // WHY: why /g can not capture (.+)
                // TODO: 改成配置的形式
                var reg = /^((?:on|off|del|run|pb|tab|his|bm|yd|todo|po))\s(.*)$/i;
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var key = mArr[2];

                if (!cmd) {
                    this.clearList();
                    return;
                }

                this.cmd = cmd;
                this.query = key;


                storage.h5.set(CONST.LAST_CMD, str);
                return plugins[this.cmd].onInput.call(this, key);
            },

            createItem: function(index, item) {
                var html = plugins[this.cmd].createItem.call(this, index, item);

                if (index <= 8) {
                    var tipHtml = '<div class="ec-item-tip">' + (util.isMac ? 'CTRL' : 'ALT') + ' + ' + (index + 1) + '</div>';
                    html.splice(html.length - 2, 0, tipHtml);
                }

                return html.join('');
            }

        });

        cmdbox.bind('init', function() {
            var cmd = storage.h5.get(CONST.LAST_CMD) || 'todo ';

            this.ipt.val(cmd);
            this.render(cmd);
        });

        cmdbox.bind('enter', function(event, elem) {
            if (!this.cmd) {
                var key = $(elem).data('id');
                this.render(key + ' ');

                return;
            }

            plugins[this.cmd].onEnter.call(this, $(elem).data('id'), elem);
        });

        cmdbox.bind('empty', function() {
            var that = this;

            that.cmd = 'todo';
            that.searchTimer = setTimeout(function() {
                plugins.todo.showTodos.call(that);
            }, that.delay);
        });

        cmdbox.bind('show', function() {
            this.ipt.addClass('cmdbox-drop');
        });

        cmdbox.bind('clear', function() {
            this.ipt.removeClass('cmdbox-drop');
        });

        cmdbox.init();
    }

    init();
});
