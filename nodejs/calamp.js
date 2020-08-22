import dgram  from 'dgram';
import  mysql  from 'mysql';
import decode from './decode.js'

const loadMysql = (envs)=>{
    const mysql_link = mysql.createConnection(envs);
        mysql_link.connect(function(err){
            if(err) { setTimeout(s.mysql_up, 2000); }else{console.log('conectado')}
        });
        loadDgram(mysql_link)
}

const loadDgram = (mysql)=>{
    const server = dgram.createSocket('udp4');
    
    server.on('error', (err) => { console.log(`server error:\n${err.stack}`); server.close(); });
      
    server.on('message', (message, gps) => {
         const RequestHandler = async ( )=>{
            await mysql.query('SELECT * FROM users', function(err, rows ,fields){
               const users = rows
            })
            
        }
        RequestHandler()
        const packet = decode(message)
        console.log(0)
    });
      
    server.on('listening', () => { const address = server.address(); console.log(`server listening ${address.address}:${address.port}`); });
    server.bind(3001);
}


loadMysql({ user: "root", password: process.env['DB_PASSWORD'], database: "laravel" })


