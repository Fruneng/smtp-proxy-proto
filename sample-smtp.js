var SMTPServer = require('smtp-server').SMTPServer;

var logger = require('./src/logger.js')

var config = require('./config.js')

var SERVER_PORT = config.upstream.port
var SERVER_HOST = config.upstream.host

// Connect to this example server by running
//   telnet localhost 2525
// or
//   nc -c localhost 2525

// Authenticate with this command (username is 'testuser' and password is 'testpass')
//   AUTH PLAIN dGVzdHVzZXIAdGVzdHVzZXIAdGVzdHBhc3M=

// Setup server
var server = new SMTPServer({

    // not required but nice-to-have
    banner: 'Welcome to My Awesome SMTP Server',

    // disable STARTTLS to allow authentication in clear text mode
    disabledCommands: ['STARTTLS'],

    // By default only PLAIN and LOGIN are enabled
    authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],

    // Accept messages up to 10 MB
    size: 10 * 1024 * 1024,

    // allow overriding connection properties. Only makes sense behind proxy
    useXClient: true,

    logger: logger,

    // Setup authentication
    // Allow only users with username 'testuser' and password 'testpass'
    onAuth: function(auth, session, callback) {
        var username = config.upstream.user;
        var password = config.upstream.pass;

        // check username and password
        if (auth.username === username &&
            (
                auth.method === 'CRAM-MD5' ?
                auth.validatePassword(password) : // if cram-md5, validate challenge response
                auth.password === password // for other methods match plaintext passwords
            )
        ) {
            return callback(null, {
                user: username // value could be an user id, or an user object etc. This value can be accessed from session.user afterwards
            });
        }

        return callback(new Error('Authentication failed'));
    },

    // Validate MAIL FROM envelope address. Example allows all addresses that do not start with 'deny'
    // If this method is not set, all addresses are allowed
    onMailFrom: function(address, session, callback) {
        if (/^deny/i.test(address.address)) {
            return callback(new Error('Not accepted'));
        }
        callback();
    },

    // Validate RCPT TO envelope address. Example allows all addresses that do not start with 'deny'
    // If this method is not set, all addresses are allowed
    onRcptTo: function(address, session, callback) {
        var err;

        if (/^deny/i.test(address.address)) {
            return callback(new Error('Not accepted'));
        }

        // Reject messages larger than 100 bytes to an over-quota user
        if (address.address.toLowerCase() === 'almost-full@example.com' && Number(session.envelope.mailFrom.args.SIZE) > 100) {
            err = new Error('Insufficient channel storage: ' + address.address);
            err.responseCode = 452;
            return callback(err);
        }

        callback();
    },

    // Handle message stream
    onData: function(stream, session, callback) {
        stream.pipe(process.stdout);
        stream.on('end', function() {
            var err;
            if (stream.sizeExceeded) {
                err = new Error('Error: message exceeds fixed maximum message size 10 MB');
                err.responseCode = 552;
                return callback(err);
            }
            callback(null, 'Message queued as abcdef'); // accept the message once the stream is ended
        });
    }
});

server.on('error', function(err) {
    console.log('Error occurred');
    console.log(err);
});

// start listening
server.listen(SERVER_PORT, SERVER_HOST);
