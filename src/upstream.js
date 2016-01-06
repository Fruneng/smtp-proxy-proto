
var SMTPConnection  = require('smtp-connection')
var config = require('../config.js')

module.exports.login = function (auth, session, callback){
    var connection = new SMTPConnection({
        port: config.upstream.port,
        host: config.upstream.host,
    });

    connection.once('error', function(error){
        console.log(error)
        if (session._upstream){
            session._upstream.close()
            session._upstream = null
        }
        callback(new Error('Authentication failed'))
    })

    connection.connect(function(cb){
        connection.login({
            user: auth.username,
            pass: auth.password,
        }, function(err){
            session._upstream = connection
            callback(err)
        })
    })
}

module.exports.send = function (mail, session, callback){
    mail.build(function(err, message){
        if (err) {
            return callback(new Error('inner error'))
        }

        if (session._upstream){

            session._upstream.send(getEnvelope(session), message, function(err){
                callback(err)
            })
        }else{
            callback(new Error('broken upstream connect'))
        }
    });
}

function getEnvelope(session){
    var envelope = {
        from: session.envelope.mailFrom.address, 
        to: []
    }

    for (var i in session.envelope.rcptTo){
        envelope.to.push(session.envelope.rcptTo[i].address)
    }
    return envelope
}