module.exports = {
    server:{
        host: 'localhost',
        port: 9025
    },
    upstream: {
        // host: 'smtp.mxhichina.com',
        // port: 25,
        host: 'localhost',
        port: 9026,
        user: 'test@example.com',
        pass: 'test',
        xMailer: 'smtp-proxy',
    }

}