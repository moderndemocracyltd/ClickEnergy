import crc from 'crc';
export const convertCodeToByteArray = code => {
    let bytes = [];
    for (const index in code) {
        const char = code.charCodeAt(index);
        bytes = bytes.concat([char & 0xff, char / 256 >>> 0]);
    }
    return bytes;
}

export const hexToBytes = (hex) => {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

export const bytesToHex = (bytes) => {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}

export const ascii_to_hexa = (str) => {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}

export const processTopUpCode = code => {
    const noSpaces = code.split(" ").join("");
    const batchSize = noSpaces.length / 10;
    const codeArray = Array.from(noSpaces);

    let splitArrays = chunkArray(codeArray, batchSize);
    for (let batch of splitArrays) {
        [batch[0], batch[1], batch[2], batch[3], batch[4]] = [
            `${batch[1]}${batch[0]}`,
            `${batch[3]}${batch[2]}`,
            `${batch[5]}${batch[4]}`,
            `${batch[7]}${batch[6]}`,
            `${batch[9]}${batch[8]}`
        ];
        batch.length = 5;
    }

    let packets = [];
    for (const i in splitArrays) {
        const remainingHex = getRemainingPacketHex(i, splitArrays.length);
        const packet = [0xC8, remainingHex, ...splitArrays[i], 0xCC];
        packets.push(packet);
    }
    console.log("Packets:", packets);
    return packets;
}

export const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getRemainingPacketHex = (currentIndex, batchLength) => {
    const remaining = batchLength - (parseInt(currentIndex) + 1)
    switch (remaining) {
        case 0: return 0x30
        case 1: return 0x31
        case 2: return 0x32
        case 3: return 0x33
        case 4: return 0x34
        case 5: return 0x35
        case 6: return 0x36
        case 7: return 0x37
        case 8: return 0x38
    }
}

const chunkArray = (arr, n) => {
    var chunkLength = Math.max(arr.length / n, 1);
    var chunks = [];
    for (var i = 0; i < n; i++) {
        if (chunkLength * (i + 1) <= arr.length) chunks.push(arr.slice(chunkLength * i, chunkLength * (i + 1)));
    }
    return chunks;
}

export const getCRCResponse = (packet, currentCRC = 0x0000) => {
    const first7Bytes = [...packet]
    first7Bytes.pop();
    const mapped = first7Bytes.map((byte, index) => index >= 2 ? `0x${byte}` : byte);
    const crcRes = crc.crc16ccitt(mapped, currentCRC).toString(16);
    console.log('CRC:', "0x" + crcRes);
    return crcRes;
}