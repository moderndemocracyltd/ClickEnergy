
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