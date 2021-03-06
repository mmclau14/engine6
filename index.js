// use with express like this
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
module.exports = {
    renders: function () {
        return function (filePath, options, callback) {
            fs.readFile(filePath, function (err, content) {
                if (err) {
                    return callback(new Error(err));
                }
                var string = content.toString();
                var rep = options.replacements;
                var replaces = function (memo, value, key) {
                    return memo.replace(new RegExp(key, 'gm'), value);
                };
                var rel = path.relative(filePath, options.rootpath).slice(1);
                return callback(null, _.reduce({
                    __ROOT_URL__: rel
                }, replaces, _.reduce(rep, replaces, string)));
            });
        };
    },
    static: function (rootpath, extension, opts_) {
        var xtensionIsString = _.isString(extension),
            xtension = xtensionIsString ? extension : '.html',
            opts = xtensionIsString ? opts_ : extension,
            options = _.isFunction(opts) ? opts : function () {
                return opts;
            };
        return function (req, res, next) {
            var url = req.url;
            var justpath = url.split('?')[0].split('#')[0];
            var extension = path.extname(justpath);
            if (extension !== xtension) {
                return next();
            }
            var fullpath = path.join(rootpath, justpath);
            fs.stat(fullpath, function (err, stats) {
                if (err) {
                    return next();
                }
                if (stats.isFile()) {
                    res.render(fullpath, {
                        rootpath: rootpath,
                        replacements: options(req, res)
                    });
                } else {
                    next();
                }
            });
        };
    }
};