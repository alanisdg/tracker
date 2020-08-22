import moment from 'moment'
import {hex2bin,uintToInt,bin2dec} from './convert.js'
const get_decimal= (str)=>{
   return parseInt(str,16)
}
const parse_LatLng = (v)=>{
    const d = parseInt(v,16); 
    return (d < parseInt('7FFFFFFF', 16)) ? (d /  10000000) : 0 - ((parseInt('FFFFFFFF', 16) - d) / 10000000);

}
const decode = (message)=>{
    const message_str = message.toString('hex');
    const packet = {}

    packet.OptionsByte = message_str.substring(0,2);
    packet.MobileIDLength = message_str.substring(2,4);
    packet.MobileID = message_str.substring(4,19);
    packet.MobileIDLen = message_str.substring(20,22);
    packet.MobileIDType = message_str.substring(22,24);
    packet.ServiceType = message_str.substring(24,26);
    packet.MessageType = message_str.substring(26,28);
    packet.Secuence = message_str.substring(28,32);
    packet.timeOfFix =  moment(  get_decimal (message_str.substring(40,48))*1000 ).utcOffset('0').format("YYYY-MM-DD HH:mm:ss");
    packet.updateTime = moment(  get_decimal (message_str.substring(32,40))*1000 ).utcOffset('0').format("YYYY-MM-DD HH:mm:ss");
    packet.lat = parse_LatLng( message_str.substring(48,56) );
    packet.lng =parse_LatLng( message_str.substring(56,64) );
    packet.Altitude = get_decimal(message_str.substring(64,72));
    packet.Speed = parseFloat(get_decimal(message_str.substring(72,80)) * 0.36).toFixed(1);
    packet.Heading = get_decimal(message_str.substring(81,84));
    packet.Satellites = get_decimal(message_str.substring(84,86));
    packet.FixStatus = message_str.substring(86,88);
    packet.Carrier = message_str.substring(88,92);
    packet.RSSI = uintToInt(bin2dec(hex2bin( message_str.substring(92,96) )), 10);
    packet.CommState = message_str.substring(96,98);
    packet.HDOP = get_decimal(message_str.substring(98,100));
    packet.INPUTS = message_str.substring(100,102);
    packet.UnitStatus = message_str.substring(102,104);
    packet.EventIndex = get_decimal(message_str.substring(104,106));
    packet.EventCode = get_decimal(message_str.substring(106,108));
    packet.AccumCount = get_decimal(message_str.substring(108,110));
    packet.Spare = message_str.substring(110,112);
    packet.message = message_str;
    packet.Accum0 = get_decimal(message_str.substring(112,120));
    packet.power_supply = parseFloat(packet.Accum0/1000).toFixed(2);
    packet.Accum1 = get_decimal(message_str.substring(120,128));
    packet.power_bat = parseFloat(packet.Accum1/1000).toFixed(2);
    packet.Accum2 = get_decimal(message_str.substring(128,136));
    packet.Accum3 = get_decimal(message_str.substring(136,144));
    packet.odometro_total = packet.Accum3;
    packet.Accum4 = get_decimal(message_str.substring(144,152));
    packet.odometro_reporte = packet.Accum4;
    return packet;
}

export default decode