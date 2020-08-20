var dgram = require("dgram");
var moment = require('moment');
var moment = require('moment-timezone');
var mysql = require('mysql');
var request = require('request');
var io = require('socket.io')(3000);


var Server = function(){
    var s = this;
    this.packet;
    this.mysql_conf = { user: "root", password: "56fg.tyyhY", database: "notes" };
    this.listener = dgram.createSocket("udp4");
    this.lport = 3001; //7777;

     function onLoad(){

        s.load_listener();
    }

    this.load_mysql = function(){ s.mysql_up(); }
    this.mysql_up = function(){
        s.mysql_link = mysql.createConnection(s.mysql_conf);
        s.mysql_link.connect(function(err){
            if(err) { setTimeout(s.mysql_up, 2000); }
        });
        s.mysql_link.on('error', function(err){ if(err.code === 'PROTOCOL_CONNECTION_LOST'){ s.mysql_up(); } else { throw err; } });
    }

    this.load_listener = function(){
        s.listener.bind(s.lport);
        s.listener.on("listening", function(){ console.log("[Listener Server is running and waiting for packets on port: "+s.lport+"]"); });
        s.listener.on("message", function(packet,guest){

            buffer_str = packet.toString('hex');
            type = buffer_str.substring(0,1);
            if(type ==7){

                io.sockets.emit('message1', 'sobres');
            }else{
                s.process_dgram(packet,guest);
            }
        });
    }

    this.process_dgram = function(datagram,guest){
         console.log('[--- ('+moment().tz("America/Monterrey").format("YYYY-MM-DD HH:mm:ss")+'@'+guest.address+":"+guest.port+') ----]');

        var buffer_str = datagram.toString('hex');
        console.log(buffer_str)
        this.get_decimal= function(str){
            return parseInt(str,16)
        }
        this.parse_LatLng = function(v){
            d = parseInt(v,16); return (d < parseInt('7FFFFFFF', 16)) ? (d /  10000000) : 0 - ((parseInt('FFFFFFFF', 16) - d) / 10000000);
        }


        this.packet = new Object();
        this.packet.OptionsByte = buffer_str.substring(0,2);
        this.packet.MobileIDLength = buffer_str.substring(2,4);
        this.packet.MobileID = buffer_str.substring(4,19);
        this.packet.MobileIDLen = buffer_str.substring(20,22);
        this.packet.MobileIDType = buffer_str.substring(22,24);
        this.packet.ServiceType = buffer_str.substring(24,26);
        this.packet.MessageType = buffer_str.substring(26,28);
        this.packet.Secuence = buffer_str.substring(28,32);
        this.packet.timeOfFix =  moment(  this.get_decimal (buffer_str.substring(40,48))*1000 ).utcOffset('0').format("YYYY-MM-DD HH:mm:ss");
        this.packet.updateTime = moment(  this.get_decimal (buffer_str.substring(32,40))*1000 ).utcOffset('0').format("YYYY-MM-DD HH:mm:ss");
        this.packet.updateTimeOnly = moment(  this.get_decimal (buffer_str.substring(32,40))*1000 ).utcOffset('0').format("YYYY-MM-DD");

        this.packet.lat = this.parse_LatLng( buffer_str.substring(48,56) );
        this.packet.lng =this.parse_LatLng( buffer_str.substring(56,64) );
        this.packet.Altitude = this.get_decimal(buffer_str.substring(64,72));
        this.packet.Speed = this.get_decimal(buffer_str.substring(72,80));
        speed = this.packet.Speed*.036

        this.packet.Speed = parseFloat(speed).toFixed(1);
        //this.packet.Speed = speed;
        this.packet.Heading = this.get_decimal(buffer_str.substring(81,84));
        this.packet.Satellites = this.get_decimal(buffer_str.substring(84,86));
        this.packet.FixStatus = buffer_str.substring(86,88);
        this.packet.Carrier = buffer_str.substring(88,92);
        this.packet.RSSI = convertBase.uintToInt(convertBase.bin2dec(convertBase.hex2bin( buffer_str.substring(92,96) )), 10);
        this.packet.CommState = buffer_str.substring(96,98);
        this.packet.HDOP = this.get_decimal(buffer_str.substring(98,100));
        this.packet.INPUTS = buffer_str.substring(100,102);
        this.packet.UnitStatus = buffer_str.substring(102,104);
        this.packet.EventIndex = this.get_decimal(buffer_str.substring(104,106));
        this.packet.EventCode = this.get_decimal(buffer_str.substring(106,108));
        this.packet.AccumCount = this.get_decimal(buffer_str.substring(108,110));
        this.packet.Spare = buffer_str.substring(110,112);
        this.packet.buffer = buffer_str;
        this.packet.Accum0 = this.get_decimal(buffer_str.substring(112,120));
        power_supply = this.packet.Accum0;
        power_supply = power_supply/1000;
        this.packet.power_supply = parseFloat(power_supply).toFixed(2);
        this.packet.Accum1 = this.get_decimal(buffer_str.substring(120,128));
        power_bat = this.packet.Accum1;
        power_bat = power_bat/1000;
        this.packet.power_bat = parseFloat(power_bat).toFixed(2);
        this.packet.Accum2 = this.get_decimal(buffer_str.substring(128,136));
        this.packet.Accum3 = this.get_decimal(buffer_str.substring(136,144));
        this.packet.odometro_total = this.packet.Accum3;
        this.packet.Accum4 = this.get_decimal(buffer_str.substring(144,152));
        this.packet.odometro_reporte = this.packet.Accum4;
        this.packet.odometro = 5;
        //console.log('PASO 1 DESMEMBRE')
        function getDeviceId(imei,packet, callback)
        {
            //console.log('PASO 3  entro a getdeviceid')
            // OBTENER INFORMACION NECESARIA ANTES DE INGRESAR EL PAQUETE A BASE DE DATOS
            s.mysql_link.query('SELECT id,client_id,travel_id,name,geofences,boxs_id,type_id,stop,stop_time,bad_engine,engine,onroad,tocheck,out_alert,comentario  FROM devices WHERE imei='+imei, function(err, rows ,fields)
            {
                if (err){
                    callback(err,null);

                }else{
                //console.log('PASO 4 info del device')
                    if(rows[0].boxs_id !=null){
                        packet.boxs_id = rows[0].boxs_id;
                    }else{
                        packet.boxs_id = false;
                    }
                    packet.device_id = rows[0].id
                    packet.device_name = rows[0].name
                     //console.log('NAME ' + packet.device_name + ' ->' + packet.updateTime + '-<PASO 1')
                    packet.client_id = rows[0].client_id
                    packet.travel_id = rows[0].travel_id
                    packet.actual_geofences = rows[0].geofences
                    packet.device_id = rows[0].id
                    packet.onroad = rows[0].onroad

                    packet.tocheck = rows[0].tocheck
                    packet.out_alert = rows[0].out_alert
                    packet.device_name = rows[0].name
                    packet.client_id = rows[0].client_id
                    packet.stop = rows[0].stop
                    packet.stop_time = rows[0].stop_time
                    packet.bad_engine = rows[0].bad_engine
                    packet.engine_status = rows[0].engine
                    packet.type_id = rows[0].type_id

                    if(packet.engine_status == null){
                        packet.engine_status  = 0;
                     }
                }
                // REVISAR QUE NO ESTE REPETIDO EN VIVO

               // console.log('SELECT COUNT(*) FROM  packets_lives WHERE imei="'+packet.MobileID+'" AND updateTime="'+packet.updateTime+'"' + '  --> ' +packet.device_name)
                // SELECT id, v2_dateTimeServer FROM gprs WHERE imei="'+s.v2_packet.imei+'" ORDER BY v2_dateTimeServer DESC LIMIT 1;
                s.mysql_link.query('SELECT id, updateTime FROM packets_lives WHERE imei="'+packet.MobileID+'" ORDER BY updateTime DESC LIMIT 1;',function(err, rows, fields){
                        if(err){  throw err; }

                        if(isEmpty(rows)){
                            packet.movement = false
                                    packet.dstate_id = 1
                                    packet.odometro_reporte = null;
                                    packet.odometro = null;
                                    packet.ides_geofence = null
                                    packet.actual_geofences = null

                                                packet.geofence = '[]'
                                                packet.stored = 0

                                                 s.mysql_link.query('SELECT *  FROM clients_devices WHERE devices_id='+packet.device_id, function(err, rows ,fields){

                                                      var clients_emit = []

                                                        for (i = 0; i < rows.length; i++) {

                                                                clients_emit.push(rows[i].clients_id);
                                                            }


                                                    packet.clients_emit = clients_emit
                                                    callback(null,packet);
                                                })

                        }else{
                        if(moment(rows[0].updateTime).format('YYYY-MM-DD HH:mm:ss') == packet.updateTime)
                        {
                        //console.log(packet.device_name + ' -> REPETIDO EN VIVO ' + packet.updateTime)
                          //  console.log('PASO 2.1 ' + packet.device_name)
                          packet.LastupdateTime = moment(rows[0].updateTime).format('YYYY-MM-DD HH:mm:ss');
                            packet.stored = 1
                            callback(null,packet);
                        }
                        else
                        {
                         //   console.log('NO REPETIDO ' + packet.updateTime + ' ' +packet.device_name)

                            packet.LastupdateTime = moment(rows[0].updateTime).format('YYYY-MM-DD HH:mm:ss');
                            // REVISAR REPORTE ANTERIOR PARA CALCULAR MOVIMIENTO Y ODOMETRO
                            s.mysql_link.query('SELECT * FROM packets WHERE devices_id ='+packet.device_id +' ORDER BY id DESC LIMIT 1', function(err, rows, fields){
                              //  console.log('PASO 2.2 ' + packet.device_name)
                                //console.log('PASO 6 calculado odometro')
                                if(isEmpty(rows)){
                                    packet.movement = false
                                    packet.dstate_id = 1
                                    packet.odometro_reporte = null;
                                    packet.odometro = null;
                                }else{
                                    this.previous_packet = new Object();
                                    this.previous_packet.id = rows['0'].id;
                                    previous_lat = rows['0'].lat;
                                    previous_lng  = rows['0'].lng;
                                    odo_anterior =  rows['0'].odometro_reporte;
                                    update_anterior =  rows['0'].updateTime;
                                    packet.odometro = functions.odometro(packet.odometro_reporte,odo_anterior);
                                    packet.previous_heading = rows['0'].heading;

                                    distance = packet.odometro;
                                    // SI SE MUEVE MAS DE 300 mts y no tiene viaje
                                    if(packet.Speed > 0){
                                    }
                                    if(distance > 100 && packet.travel_id == null){
                                        packet.movement = true
                                        packet.dstate_id = 1
                                        sql = 'update devices set porque="'+distance + '-' + packet.travel_id+'" where id='+packet.device_id;

                                        s.mysql_link.query(sql,function(err, rows, fields){

                                        })
                                    }else if(distance > 100 && packet.travel_id != null){

                                        // SI SE MUEVE MAS DE 300 mts y si tiene viaje
                                        packet.movement = true
                                        packet.dstate_id = 2
                                    }else if(distance < 100){
                                        // SI SE MUEVE MENOS DE 300 mts
                                        packet.movement = false
                                        packet.dstate_id = 4
                                    }

                                    // TIEMPO ENTRE REPORTE Y REPORTE

                                    start_t = moment(update_anterior);
                                    finish_t = moment(packet.updateTime);
                                    go = finish_t.diff(start_t, 'minutes');
                                    packet.timeBeetween = go;
                                    // TIEMPO ENTRE REPORTE Y REPORTE

                                    // REVISAR STOP TIME
                                    //packet.stop_time = '';

                                    if(packet.stop==0){
                                        if(packet.Speed < 2){
                                            packet.stop = 1;
                                            //acaba de detenerse
                                            //console.log('acaba de deterse')
                                            sql_stop = 'update devices set stop=1,stop_time=0 where id='+packet.device_id;

                                            s.mysql_link.query(sql_stop,function(err, rows, fields){})
                                        }
                                    }
                                    if(packet.stop==1){
                                        if(packet.Speed > 2){
                                            packet.stop = 0;
                                            //acaba de arrancar
                                            //console.log('acaba de arrancar')
                                            sql_stop = 'update devices set stop=0,stop_time=0 where id='+packet.device_id;

                                            s.mysql_link.query(sql_stop,function(err, rows, fields){})
                                        }
                                    }
                                    if(packet.stop==1){
                                        if(packet.Speed < 2){
                                            packet.stop = 1;
                                            //sigue detenido sumar horas
                                            //console.log('sigue detenido')
                                            start = moment(update_anterior);
                                            finish = moment(packet.updateTime);
                                            go = finish.diff(start, 'minutes');
                                            total = packet.stop_time + go;
                                            packet.stop_time = total;


                                            sql_stop = 'update devices set stop=1,stop_time='+total+' where id='+packet.device_id;

                                            s.mysql_link.query(sql_stop,function(err, rows, fields){})
                                        }
                                    }
                                    if(packet.stop==0){
                                        if(packet.Speed > 2){
                                            packet.stop = 0;
                                            sql_stop = 'update devices set stop=0,stop_time=0 where id='+packet.device_id;

                                            s.mysql_link.query(sql_stop,function(err, rows, fields){})
                                        }
                                    }
                                    //::Termina stop time


                                }

                                // TRER POPS
                                       // REVISAR EN QUE GEOCERCA ESTA
                                        s.mysql_link.query('SELECT *  FROM pops WHERE devices_id ='+packet.device_id +' ORDER BY id desc LIMIT 1', function(err, rows ,fields){

                                            if(err){  throw err; }

                                            if(isEmpty(rows)){

                                            }else{
                                                packet.comentario = rows[0].comentario
                                                packet.comentario_user_id = rows[0].user_id
                                                packet.comentario_update_time = moment(rows[0].created_at).format('YYYY-MM-DD HH:mm:ss')
                                                packet.comentario_id = rows[0].id
                                                packet.comentario_user_name = rows[0].user_name

                                            }


                                        })

                                            // REVISAR EN QUE GEOCERCA ESTA
                                        s.mysql_link.query('SELECT *  FROM geofences WHERE deleted_at IS null AND  id_client='+packet.client_id, function(err, rows ,fields){
                                            if(err){  throw err; }

                                                geofence_detect = functions.geofences2(rows,packet.lat,packet.lng);
                                                packet.ides_geofence = geofence_detect['ides_geofence']

                                                packet.geofence = geofence_detect['geofence']
                                                packet.info_geofence = geofence_detect['info_geofence']
                                                 //console.log(packet.info_geofence);
                                                packet.stored = 0
                                                //console.log('PASO 8 terminar get device id')
                                                s.mysql_link.query('SELECT *  FROM clients_devices WHERE devices_id='+packet.device_id, function(err, rows ,fields){

                                                      var clients_emit = []
                                                     /*  console.log(' empieza ---<' + packet.device_name + ' SELECT *  FROM clients_devices WHERE devices_id='+packet.device_id)
                                                      console.log(rows)
                                                      console.log(' --') */
                                                        for (i = 0; i < rows.length; i++) {

                                                                clients_emit.push(rows[i].clients_id);
                                                            }

                                                    //console.log(' termino ' + packet.device_name)
                                                    packet.clients_emit = clients_emit
                                                    callback(null,packet);
                                                })


                                        }) //: TERMINA REVISION DE GEOCERCAS

                                        s.mysql_link.query('SELECT id,polydata  FROM states', function(err, rows ,fields){
                                            if(err){  throw err; }

                                            //console.log('PASO 7 checar geocercas')

                                                state = functions.state(rows,packet.lat,packet.lng,inside);
                                                packet.state = state


                                        }) //: TERMINA REVISION DE GEOCERCAS
                            }) //: termina revisar reporte anterior
                        }



                        } //:: else no fue repetido en vivo
                })
            })
        } //:: FUNCTION getDeviceId

        //console.log('PASO 2 ejecutar getDeviceid')
        getDeviceId(this.packet.MobileID,this.packet,function(err,packet){
            //console.log('PASO 9')
            if(err){ console.log(err)}
               // console.log('result stored.->' + packet.stored + ' - ' + packet.device_name + 'PASO 3' )
            if(packet.stored  == 0){
               // console.log('insertar al ' + packet.device_name)
                // SE CONSTRUYEN LAS 3 QUERYS

                //---------> ENCENDIDO APAGADO
                        packet.engine = packet.engine_status
                        if(packet.EventCode == 20){
                            packet.engine = 0;
                        }
                        if(packet.EventCode == 21){
                            packet.engine=1;
                        }
                //---------->::termina encendido apagado

                s.query_insert = functions.build_query(packet,'packets',packet.device_id,packet.device_name);
                s.query_insert_live = functions.build_query(packet,'packets_lives',packet.device_id,packet.device_name);
                s.query_histories = functions.build_query(packet,'packets_histories',packet.device_id,packet.device_name);
                if(packet.boxs_id != false){
                    s.query_insert_box = functions.build_query(packet,'packets_lives',packet.boxs_id);
                }
                if(1 < 5){
                    startto = moment(Date.now()).format('YYYY-MM-DD');
                    finish_to = moment(packet.updateTimeOnly);
                    //got = finish_t.diff(start_t, 'minutes');

                    so = moment(packet.updateTimeOnly).isSameOrAfter(startto, 'day');
                    si = moment(finish_to).isSameOrAfter(startto, 'day');
                    console.log(so,si,packet.updateTimeOnly,finish_to,startto);
                s.mysql_link.query(s.query_insert, function(err, rows, fields){
                    if(err){ console.log("MySQL ERROR 'query_insert' "); throw err; }else{
                       // console.log(packet.device_name + ' -> INSERTADO EN BASE   ' + packet.LastupdateTime + ' - ' + packet.updateTime)
                       // s.return_ack(packet,guest.port,guest.address);
                        // REVISAR ENCENDIDO Y SIN MOVIMIENTO
                               if(packet.engine_status == 1 && packet.odometro < 100){
                                    if(packet.bad_engine == 0){
                                        sql = 'update devices set bad_engine=1 where id='+packet.device_id;
                                        s.mysql_link.query(sql,function(err, rows, fields){ })

                                        sql_bad = 'INSERT INTO bengines set device_id='+packet.device_id + ', packet_id='+rows.insertId + ', bad=1 , updateTime="'+packet.updateTime+'" ,lat="'+packet.lat+'" ,lng ="'+packet.lng+'"';

                                        s.mysql_link.query(sql_bad,function(err, rows, fields){ })
                                    }

                               }
                               if(packet.engine_status == 1 && packet.odometro > 100){
                                    if(packet.bad_engine == 1){
                                        sql = 'update devices set bad_engine=0 where id='+packet.device_id;
                                        s.mysql_link.query(sql,function(err, rows, fields){ })

                                        sql_good = 'INSERT INTO bengines set device_id='+packet.device_id + ', packet_id='+rows.insertId + ', bad=0, updateTime="'+packet.updateTime+'" ,lat="'+packet.lat+'" ,lng ="'+packet.lng+'"';

                                        s.mysql_link.query(sql_good,function(err, rows, fields){ })


                                    }
                               }
                            //
                            // hjconsole.log(packet.device_name + ' -> SIGUE VIVO 1 ' )

                        if(packet.EventCode == '69'){
                             s.mysql_link.query('UPDATE devices set unplugged=0 WHERE id='+packet.device_id, function(err, rows, fields){
                        })
                        }
                        //---------> ENCENDIDO APAGADO
                        packet.engine = packet.engine_status
                        if(packet.EventCode == 20){
                            packet.engine = 0;
                            device_engine  = "UPDATE devices set engine=0 WHERE id="+packet.device_id;
                            s.mysql_link.query(device_engine, function(err, rows, fields){ if(err){throw err;} })
                        }
                        if(packet.EventCode == 21){
                            packet.engine=1;
                            device_engine  = "UPDATE devices set engine=1 WHERE id="+packet.device_id;
                            s.mysql_link.query(device_engine, function(err, rows, fields){if(err){throw err;} })


                        }
                        //---------->::termina encendido apagado
                       // console.log('-> SIGUE VIVO 2 ' + packet.device_name)
                        //------->::EVENTCODE
                       // console.log('emitir evento')
                       if(packet.device_name =='101'){
                        console.log(packet.EventCode + ' llego esto')
                       }
                        if(packet.EventCode == '116'){
                             s.mysql_link.query('UPDATE devices set elock=2, stepBlock = 0 WHERE id='+packet.device_id, function(err, rows, fields){
                        })
                        }

                        if(packet.EventCode == '118'){
                            console.log()
                             s.mysql_link.query('UPDATE devices set elock=null,stepBlock = 0 WHERE id='+packet.device_id, function(err, rows, fields){
                        })
                        }

                        if(packet.EventCode == '68'){
                             s.mysql_link.query('UPDATE devices set unplugged=1 WHERE id='+packet.device_id, function(err, rows, fields){ })

                             s.mysql_link.query('SELECT * FROM clients WHERE id='+packet.client_id, function(err, rows, fields){


                                    if(rows[0].mail_alerts ==  1 ){
                                        if(packet.type_id ==  1 ){
                                        nodemailer.createTestAccount((err, account) => {
                             var transporter = nodemailer.createTransport({
                                              host: 'smtp.gmail.com',
                                              port: 587,
                                              secure: false, // secure:true for port 465, secure:false for port 587
                                              auth: {
                                                user: 'alanisdg@gmail.com',
                                                pass: '547aj154a2'
                                              }
                                            });


                                            // setup email data with unicode symbols
                                            let mailOptions = {
                                                from: 'USAMEXGPS <alertas@usamexgps.com>', // sender address
                                                to: 'alanisdg@gmail.com, nestor.sandoval@usamexgps.com, supervisor@express57.com', // list of receivers
                                                subject: 'Unidad ' + packet.device_name + ' desconectada', // Subject line
                                                text: 'Alerta de desconexion', // plain text body
                                                html: '<b>La unidad '+ packet.device_name+' ha sido desconectada</b><br> Fecha: '+ packet.updateTime+'  <a href="https://www.google.com/maps/search/?api=1&query='+packet.lat+','+packet.lng+'">Ubicación</a>' // html body
                                            };

                                            transporter.sendMail(mailOptions, (error, info) => {
                                                if (error) {
                                                    return console.log(error);
                                                }
                                                console.log('Message sent: %s', info.messageId);
                                                // Preview only available when sending through an Ethereal account
                                                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                                                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                                                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                                            });
});

                                    }
                                }
                             })


                        }

                        if(packet.EventCode == '60'){
                            //console.log('panico')
                             s.mysql_link.query('UPDATE devices set panic=1 WHERE id='+packet.device_id, function(err, rows, fields){
                        })
                        }

                        if(packet.EventCode == '61'){
                             s.mysql_link.query('UPDATE devices set panic=1 WHERE id='+packet.device_id, function(err, rows, fields){
                            })
                        }

                        if(packet.EventCode == '61'){
                             s.mysql_link.query('UPDATE devices set panic=1 WHERE id='+packet.device_id, function(err, rows, fields){
                            })
                        }


                        if(packet.EventCode =='33'){
                            if(packet.device_id != '24'){
                                                            s.mysql_link.query('UPDATE devices set jammer=1 WHERE id='+packet.device_id, function(err, rows, fields){})
                            for (h = 0; h < packet.clients_emit.length; h++) {
                            io.sockets.emit('jammer'+packet.clients_emit[h],  {
                                        response:[
                                            packet.EventCode,
                                            packet.device_name,
                                            packet.device_id
                                        ]
                                    });
                            }

                            nodemailer.createTestAccount((err, account) => {
                             var transporter = nodemailer.createTransport({
                              host: 'smtp.gmail.com',
                              port: 587,
                              secure: false, // secure:true for port 465, secure:false for port 587
                              auth: {
                                user: 'alertasusamex@gmail.com',
                                pass: '547aj154'
                              }
                            });


                                // setup email data with unicode symbols
                                let mailOptions = {
                                    from: 'USAMEXGPS <alertas@usamexgps.com>', // sender address
                                    to: 'alanisdg@gmail.com, nestor.sandoval@usamexgps.com,supervisor@express57.com', // list of receivers
                                    subject: 'Unidad ' + packet.device_name + ' ha detectado un intento de robo', // Subject line
                                    text: 'Alerta de robo', // plain text body
                                    html: '<b>La unidad '+ packet.device_name+' ha detectado un intento de robo </b><br> Fecha: '+ packet.updateTime+'  <a href="https://www.google.com/maps/search/?api=1&query='+packet.lat+','+packet.lng+'">Ubicación</a>' // html body
                                };

                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }
                                    console.log('Message sent: %s', info.messageId);
                                    // Preview only available when sending through an Ethereal account
                                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                                    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                                    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                                });
                            });
                            }




                        }




                        for (h = 0; h < packet.clients_emit.length; h++) {
                            io.sockets.emit('event'+packet.clients_emit[h],  {
                                        response:[
                                            packet.EventCode,
                                            packet.device_name,
                                            packet.device_id
                                        ]
                                    });
                        }



                        //________>::EVENTCODE

                        // ACTUALIZAR EQUIPO COMO EL Dstate_id
                        s.mysql_link.query('UPDATE devices set dstate_id='+packet.dstate_id+' WHERE id='+packet.device_id, function(err, rows, fields){
                        })
                        //::termina actualizar equipo

                        //----------> HISTORIAL GEOCERCAS
                        packet.geofences_in =[];
                        packet.geofences_out =[];
                        if(packet.actual_geofences == null){
                            geofences = JSON.parse(packet.geofence)
                            //RECORRER LOS ID DE GEOCERCAS PARA VER CUAL ENTRO

                            for (i = 0; i < ides_geofence.length; ++i) {
                                // SI ENTRO GUARDAR EL SIGNES COMO ENTRADA
                                if(geofences[ides_geofence[i]] == 1){
                                    packet_id = rows.insertId;
                                    device_id = packet.device_id;
                                    geofence_id = ides_geofence[i];


                                    query = 'INSERT INTO signes (packet_id,geofence_id,device_id,status,updateTime)values('+packet_id+','+geofence_id+','+device_id+',1,"'+packet.updateTime+'")';


                                    s.mysql_link.query(query, function(err, rows, fields){
                                    })
                                }else{
                                }
                            }
                        }else{

                            actual_geofences = JSON.parse(packet.actual_geofences)

                            geofences = JSON.parse(packet.geofence)

                            packet_id = rows.insertId;
                            for (i = 0; i < ides_geofence.length; ++i) {
                                if(actual_geofences[ides_geofence[i]] == 1 && geofences[ides_geofence[i]] ==1){
                                    //console.log('pendientito')
                                    geofence_id = ides_geofence[i]
                                    // SI SE HIZO LA GEOCERCA CON EL EQUIPO DENTRO DE LA GEOCERCA, GUARDAR SIGNES SIEMPRE Y CUANDO NO HAYA UN 1
                                    /*s.mysql_link.query('SELECT *  FROM signes WHERE device_id="'+packet.device_id+'" AND geofence_id="'+geofence_id+'"', function(err, rows ,fields){
                                        if(err){  throw err; }
                                            if(isEmpty(rows)){
                                                console.log('pendiente')
                                                /*
                                                packet_id = rows.insertId;
                                                device_id = packet.device_id;
                                                geofence_id = ides_geofence[i];
                                                console.log(packet.device_name + ' salio de san jose')
                                                query = 'INSERT INTO signes (packet_id,geofence_id,device_id,status,updateTime)values('+packet_id+','+geofence_id+','+device_id+',1,"'+packet.updateTime+'")';
                                                io.sockets.emit('geocerca'+packet.client_id,  {
                                                    response:[
                                                        geofence_id,
                                                        packet.device_name,
                                                        'in'
                                                    ]
                                                });
                                                s.mysql_link.query(query, function(err, rows, fields){
                                                })
                                            }else{
                                                console.log('pendiente')
                                            }
                                    }) */
                                }
                                if(actual_geofences[ides_geofence[i]] == 0 && geofences[ides_geofence[i]] ==0){
                                }
                                if(actual_geofences[ides_geofence[i]] == 1 && geofences[ides_geofence[i]] ==0){
                                    packet_id = rows.insertId;
                                    device_id = packet.device_id;
                                    geofence_id = ides_geofence[i];
                                    tocheck = packet.tocheck;
                                    onroad = packet.onroad;
                                    out_alert = packet.out_alert;


                                    for (h = 0; h < packet.clients_emit.length; h++) {
                                        io.sockets.emit('geocerca'+packet.clients_emit[h],  {
                                            response:[
                                                geofence_id,
                                                packet.device_name,
                                                'out'
                                            ]
                                        });
                                    }

                                    //cambiamos in por out
                                    //packet.geofences_in.push(geofence_id)
                                    packet.geofences_out.push(geofence_id)

                                    for (gi = 0; gi < packet.info_geofence.length; gi++) {
                                          if(packet.info_geofence[gi].id == geofence_id){

                                            query = 'INSERT INTO signes (packet_id,geofence_id,device_id,status,updateTime,gcat_id)values('+packet_id+','+geofence_id+','+device_id+',0,"'+packet.updateTime+'",'+packet.info_geofence[gi].gcat_id+')';

                                            s.mysql_link.query(query, function(err, rows, fields){  })

                                            if(packet.info_geofence[gi].gcat_id == 5){
                                                devEnt = "UPDATE devices set rampa = 3 WHERE id="+device_id
                                            s.mysql_link.query(devEnt, function(err, rows, fields){})

                                             for (h = 0; h < packet.clients_emit.length; h++) {
                                                    io.sockets.emit('outRampa'+packet.clients_emit[h],  {
                                                        response:[
                                                            geofence_id,
                                                            packet.device_id,
                                                            packet.device_name,
                                                            packet.info_geofence[gi].name
                                                        ]
                                                    });
                                                }
                                            }
                                          }
                                    }





                                }
                                if(actual_geofences[ides_geofence[i]] == 0 && geofences[ides_geofence[i]] ==1){

                                    // ENTRO A GEOCERCA
                                    packet_id = rows.insertId;
                                    device_id = packet.device_id;
                                    onroad = packet.onroad;
                                    geofence_id = ides_geofence[i];

                                    for (h = 0; h < packet.clients_emit.length; h++) {
                                        io.sockets.emit('geocerca'+packet.clients_emit[h],  {
                                            response:[
                                                geofence_id,
                                                packet.device_name,
                                                'in'
                                            ]
                                        });
                                    }

                                    packet.geofences_in.push(geofence_id)

                                    for (gi = 0; gi < packet.info_geofence.length; gi++) {
                                          if(packet.info_geofence[gi].id == geofence_id){

                                            query = 'INSERT INTO signes (packet_id,geofence_id,device_id,status,updateTime,gcat_id)values('+packet_id+','+geofence_id+','+device_id+',1,"'+packet.updateTime+'",'+packet.info_geofence[gi].gcat_id+')';

                                            s.mysql_link.query(query, function(err, rows, fields){  })

                                            if(packet.info_geofence[gi].gcat_id == 5){
                                                devEnt = "UPDATE devices set rampa = 1 WHERE id="+device_id
                                            s.mysql_link.query(devEnt, function(err, rows, fields){})

                                            devEnt = "UPDATE devices set estado = 0 WHERE id="+device_id
                                            s.mysql_link.query(devEnt, function(err, rows, fields){})



                                             for (h = 0; h < packet.clients_emit.length; h++) {
                                                    io.sockets.emit('inRampa'+packet.clients_emit[h],  {
                                                        response:[
                                                            geofence_id,
                                                            packet.device_id,
                                                            packet.info_geofence[gi].name
                                                        ]
                                                    });
                                                }
                                            }
                                          }
                                    }






                                }
                            }
                        }

                        if(packet.geofence  ){
                            s.mysql_link.query("UPDATE devices set geofences ='"+packet.geofence+"'  WHERE id="+packet.device_id, function(err, rows, fields){
                                // console.log('SE ACTUALIZO DEVICE 1')
                            })
                        }else{
                            // DE LO CONTRARIO PONERLA EN 0
                              s.mysql_link.query('UPDATE devices set geofences = null WHERE id='+packet.device_id, function(err, rows, fields){
                            // console.log('SE ACTUALIZO DEVICE 2')
                        })
                        }
                        //---------->::Termina historial geocercas
                      //  console.log('-> SIGUE VIVO 4 ' + packet.device_name)
                       // console.log('PASO 11 por entrar TRACKINK')
                        // TRACKING
                        if(packet.travel_id != null){
                           /// console.log('PASO TRACKING')
                            //1er PASO TRAERSE LA INFO DEL VIAJE
                            s.mysql_link.query("SELECT id,route_id,driver_id,actual_id,tcode_id,device_id,tstate_id FROM travels WHERE id= "+packet.travel_id, function(err, rows, fields){
                                if(err){ console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â"); throw err; }
                                else{

                                    driver_id = rows[0].driver_id
                                    actual_id = rows[0].actual_id
                                    tcode_id = rows[0].tcode_id
                                    travel_id = rows[0].id

                                    s.mysql_link.query("SELECT origin_id,destination_id,references_route FROM routes WHERE id= "+rows[0].route_id, function(err, rows, fields){
                                        if(err){ console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â"); throw err;}
                                        else{
                                            origin_id = rows[0].origin_id;
                                            destination_id = rows[0].destination_id;

                                            for (i = 0; i < packet.geofences_in.length; ++i) {



                                            //rumbo a origen tstate_id = 1 por salir

                                            //COMENZO A CARGAR tstate_id = 8 cargando

                                            //TERMINO DE CARGAR SALIO A VIAJE tstate_id = 2 en ruta

                                            //COMENZO A DESCARGAR tstate_id = 9 descargando

                                            //TERMINO DE DESCARGAR TERMINO VIAJE tstate_id =4 viaje terminado


                                            if(packet.geofences_in[i] == rows[0].origin_id){

                                                //('COMENZO VIAJE A CARGAR ' + rows[0].origin_id)
                                                update_travel = 'UPDATE travels set tstate_id=8 where id='+packet.travel_id
                                                s.mysql_link.query(update_travel, function(err, rows, fields){ if(err){ console.log("MySQL ERROR 'update_travel' "); throw err; } })

                                                                    for (h = 0; h < packet.clients_emit.length; h++) { io.sockets.emit('carga_start'+packet.clients_emit[h], packet.device_id );  }

                                                }

                                                if(packet.geofences_in[i] == rows[0].destination_id){
                                                     update_travel = 'UPDATE travels set tstate_id=9 where id='+packet.travel_id
                                                s.mysql_link.query(update_travel, function(err, rows, fields){ if(err){ console.log("MySQL ERROR 'update_travel' "); throw err; } })
                                                                    for (h = 0; h < packet.clients_emit.length; h++) { io.sockets.emit('descarga_start'+packet.clients_emit[h], packet.device_id );  }
                                                }
                                            }
                                             //   console.log(packet.geofences_out[i])

                                                for (i = 0; i < packet.geofences_out.length; ++i) {
                                                if(packet.geofences_out[i] == rows[0].origin_id){
                                                    //COMENZO VIAJE
                                                    update_travel = 'UPDATE travels set tstate_id=2 where id='+packet.travel_id
                                                s.mysql_link.query(update_travel, function(err, rows, fields){ if(err){ console.log("MySQL ERROR 'update_travel' "); throw err; } })

                                                                    for (h = 0; h < packet.clients_emit.length; h++) { io.sockets.emit('travel_start'+packet.clients_emit[h], packet.device_id );  }

                                                }
                                                if(packet.geofences_out[i] == rows[0].destination_id){
                                                  //  console.log('termino')
                                                        // SI ES SALIDA

                                                        // th = "INSERT INTO thits (travel_id,tcode_id,packet_id,geofence_id,device_id)values("+packet.travel_id+","+tcode_id+","+packet_id+","+id_destino+","+packet.device_id+")";
                                                        // s.mysql_link.query(th, function(err, rows, fields){ })

                                                        //q = 'UPDATE travels set actual_id='+rows[0].destination_id+' WHERE id='+packet.travel_id;
                                                        // s.mysql_link.query(q, function(err, rows, fields){  console.log('SE ACTUALIZO DEVICE 1') })


                                                        update_driver = "UPDATE drivers set status=0 WHERE id="+driver_id;
                                                        update_device = "UPDATE devices set status=0, travel_id=null,boxs_id=null,tcode_id=null where id="+packet.device_id;
                                                        update_box = "UPDATE devices set status=0, geofences="+ "'{"+ '"'+rows[0].destination_id+'"'+ ":1}' , travel_id=null,boxs_id=null where id=" +packet.boxs_id ;

                                                        s.mysql_link.query(update_driver, function(err, rows, fields){
                                                        if(err){console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â");throw err; } })

                                                        s.mysql_link.query(update_device, function(err, rows, fields){
                                                        if(err){ console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â"); throw err; } })

                                                        s.mysql_link.query(update_box, function(err, rows, fields){
                                                        if(err){ console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â"); throw err; } })

                                                        update_travel = 'UPDATE travels set tstate_id=4 where id='+packet.travel_id
                                                        s.mysql_link.query(update_travel, function(err, rows, fields){ if(err){ console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â"); throw err; } })
                                                        for (h = 0; h < packet.clients_emit.length; h++) { io.sockets.emit('travel_end'+packet.clients_emit[h], packet.device_id );  }


                                                }//:: termina termino viaje


                                            }//::termina for
                                        }
                                    })
                                }
                            })

                        }
                        //::Termina tracking
                        //console.log('-> SIGUE VIVO 5 ' + packet.device_name)
                        // EMIT PACKET


                        for (h = 0; h < packet.clients_emit.length; h++) {

                            io.sockets.emit('message'+packet.clients_emit[h], packet);
                        }



                        //:: emit packet

                        // INSERTA EN VIVO
                        console.log( ' PASO 12 ir a insertar en vivo ')
                        s.mysql_link.query(s.query_insert_live, function(err, rows, fields){
                            if(err){ console.log("MySQL ERROR 'query_insert' "); throw err; }
                         //   console.log(packet.device_name + ' -> INSERTADO EN VIVO** ' + packet.LastupdateTime + ' - ' + packet.updateTime)
                            // REGRESA ACK
                            console.log('inserto en vivo')
                            s.return_ack(packet,guest.port,guest.address,'live');
                        })

                        s.mysql_link.query(s.query_histories, function(err, rows, fields){
                            if(err){ console.log("MySQL ERROR 'query_insert' "); throw err; }
                         //   console.log(packet.device_name + ' -> INSERTADO EN VIVO** ' + packet.LastupdateTime + ' - ' + packet.updateTime)
                            // REGRESA ACK
                            s.return_ack(packet,guest.port,guest.address,'live');
                        })

                       // console.log('-> SIGUE VIVO 6 *** ' + packet.device_name)

                        // INSERTA BOX
                        if(packet.boxs_id != false){
                            s.mysql_link.query(s.query_insert_box, function(err, rows, fields){
                                if(err){
                                    console.log("MySQL INSERT ERROR DE ESTE TAMAĂO ââžââżââ˝â");
                                    throw err;
                                }
                            })
                        } //:: termina inserta box

                      //  console.log('-> SIGUE VIVO 7 ' + packet.device_name + packet.updateTime + ' ' + packet.MobileID)
                    }

                }) //:: Termina s.query_insert
            }
            }else{
               // console.log( 'noooooo insertar al ' + packet.device_name)
                // FUE CON packetstored = 1
                s.return_ack(packet,guest.port,guest.address,'else');
            } //::packetstored
         })
    } //:: process_dgram


this.return_ack = function(packet,port,address,motivo){

    ackResponse =  packet.OptionsByte + packet.MobileIDLength + packet.MobileID +"f"+ packet.MobileIDLen + packet.MobileIDType + '0201' + packet.Secuence + '020000000000'



    ackResponse = new Buffer(ackResponse.toString('hex'),"hex")
  // console.log(packet.device_name + ' -> ACK RESPONSE ' + packet.updateTime + ' m:' + motivo)




    s.listener.send(ackResponse, 0, 22, port, address, function(err, bytes){
        if(err){
            console.log(err)
        }else{
           // console.log('-> ACK TERMINA ' + packet.device_name)
            console.log(' ')
            console.log(' ')
        }
    });
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
        return false;
    }

    return true;
}

onLoad();

} //:: var Server
var server = new Server();
