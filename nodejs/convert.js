const bin2dec = (num)=>{
    return convert(num).from(2).to(10);
}
    
const hex2bin = (num)=>{
    return convert(num).from(16).to(2);
}

const uintToInt = (uint, nbit) =>{
    nbit = +nbit || 32;
        if (nbit > 32) throw new RangeError('uintToInt only supports ints up to 32 bits');
        uint <<= 32 - nbit;
        uint >>= 32 - nbit;
        return uint;
}

const   convert = (num)=>{
    return {
        from : function (baseFrom) {
            return {
                to : function (baseTo) {
                    return parseInt(num, baseFrom).toString(baseTo);
                }
            };
        }
    };  
}

export {hex2bin,uintToInt,bin2dec}