module.exports = {
    server:{
        host: 'localhost',
        port: 9025,
        xMailer: 'smtp-proxy-proto',
    },
    upstream: {
        host: 'smtp.mxhichina.com',
        port: 25,
        // host: 'localhost',
        // port: 9026,
        user: 'test@example.com',  // just for sample stmp-server to auth, proxy
				   // has no use it
        pass: 'test',
    }

}
