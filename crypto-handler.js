module.exports = function(mailObject, callback){

    // TODO

    mailObject.subject += '   [has been crypted]'
    callback(mailObject)
}