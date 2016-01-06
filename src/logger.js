var util = require('util');



var logger = {
    _print: function( /* level, message */ ) {
        var args = Array.prototype.slice.call(arguments);
        var level = args.shift();
        var message;

        if (args.length > 1) {
            message = util.format.apply(util, args);
        } else {
            message = args.shift();
        }

        console.log('[%s] %s: %s',
            new Date().toISOString().substr(0, 19).replace(/T/, ' '),
            level.toUpperCase(),
            message);
    }
};

logger.info = logger._print.bind(null, 'info')
logger.debug = function() {}
logger.error = logger._print.bind(null, 'error')



module.exports = logger