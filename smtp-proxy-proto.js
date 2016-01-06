var SMTPServer = require('./smtp-server/smtp-server.js').SMTPServer
var logger = require('./logger.js')
var config = require('./config.js')
var upstream = require('./upstream.js')
var MailParser = require('./mailparser/mailparser.js').MailParser
var mailcomposer = require('mailcomposer');

var cryptoHandle = require('./crypto-handler.js')


var SERVER_PORT = config.server.port
var SERVER_HOST = config.server.host

// Setup server
var server = new SMTPServer({

    // not required but nice-to-have
    banner: 'Welcome to My Awesome SMTP Server',

    // disable STARTTLS to allow authentication in clear text mode
    disabledCommands: ['STARTTLS'],

    // By default only PLAIN and LOGIN are enabled
    authMethods: ['PLAIN', 'LOGIN'/*, 'CRAM-MD5'*/],

    // Accept messages up to Infinity
    size: Infinity,

    // allow overriding connection properties. Only makes sense behind proxy
    useXClient: true,

    logger: logger,

    // Setup authentication
    // Allow only users with username 'testuser' and password 'testpass'
    onAuth: function(auth, session, callback) {
        upstream.login(auth, session, function(err){
            if (err){
                callback(new Error('Authentication failed'))
            }else{
                callback(null, {
                    user: auth.username // value could be an user id, or an user object etc. This value can be accessed from session.user afterwards
                })
            }
            
        })
    },

    // Validate MAIL FROM envelope address. Example allows all addresses that do not start with 'deny'
    // If this method is not set, all addresses are allowed
    // onMailFrom: function(address, session, callback) {
    //     console.log(address)
    //     console.log(session)

    //     if (/^deny/i.test(address.address)) {
    //         return callback(new Error('Not accepted'));
    //     }
    //     callback();
    // },

    // Validate RCPT TO envelope address. Example allows all addresses that do not start with 'deny'
    // If this method is not set, all addresses are allowed
    // onRcptTo: function(address, session, callback) {
    //     var err;
    //     console.log(session)
    //     if (/^deny/i.test(address.address)) {
    //         return callback(new Error('Not accepted'));
    //     }

    //     // Reject messages larger than 100 bytes to an over-quota user
    //     if (address.address.toLowerCase() === 'almost-full@example.com' && Number(session.envelope.mailFrom.args.SIZE) > 100) {
    //         err = new Error('Insufficient channel storage: ' + address.address);
    //         err.responseCode = 452;
    //         return callback(err);
    //     }

    //     callback();
    // },

    // Handle message stream
    onData: function(stream, session, callback) {
        var mailparser = new MailParser();
        
        mailparser.on('end', function(mailObject){
            // console.log(mailObject)
            var err;
            if (stream.sizeExceeded) {
                err = new Error('Error: message exceeds fixed maximum message size 10 MB');
                err.responseCode = 552;
                return callback(err);
            }

            mailObject.headers = {}
            mailObject.headers['X-Originating-IP'] = session.remoteAddress
            if (config.server.xMailer){
                mailObject.headers['X-Mailer'] = config.server.xMailer
            }
            
            cryptoHandle(mailObject, function(mailObject){
                var mail = mailcomposer(mailObject);
                
                upstream.send(mail, session, function(err){
                    if (err){
                        console.log(err)
                        callback(new Error('something error'))
                    }else{
                        callback(null, 'Message queued as abcdef'); // accept the message once the stream is ended
                    }
                })

            })


        })

        stream.pipe(mailparser)
    },
    
    onClose: function(session, callback){
        if (session._upstream){
            session._upstream.close()
            callback()
        }
    }
});

server.on('error', function(err) {
    console.log('Error occurred');
    console.log(err);
});

// start listening
server.listen(SERVER_PORT, SERVER_HOST);
