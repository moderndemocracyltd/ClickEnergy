import Buffer from "buffer";
import { processTopUpCode } from '../Helpers/Utils';

class Meter {
    constructor() {
        this.id = "";
        this.name = "";
        this.isTransparent = false;
        this.isConnected = false;
        this.response = "";
        this.balance = "";
        this.packets = [];
        
        this.expectedCRCresponse = 0x0000;
    }

    getId = () => this.id;
    getName = () => this.name;
    getBalance = () => this.balance;
    getIsConnected = () => this.isConnected;
    getIsTransparent = () => this.isTransparent;
    getPackets = () => this.packets;
    getNextPacket = () => this.packets.shift();
    getExpectedCRCresponse = () => this.expectedCRCresponse;
    getRawResponse = () => this.response;
    getParsedResponse = () => {
        const converted = Buffer.Buffer.from(this.response, 'hex').toString();
        const response = converted.split("").reverse().join("");
        return response;
    }

    setId = id => { this.id = id }
    setName = name => { this.name = name }
    setBalance = balance => { this.balance = balance }
    setResponse = response => { this.response = response }
    addResponse = response => { this.response += response }
    clearResponse = () => { this.response = "" }
    setIsConnected = isConnected => { this.isConnected = isConnected }
    setIsTransparent = transparency => { this.isTransparent = transparency }
    setPackets = topUpCode => { this.packets = processTopUpCode(topUpCode) }
    setExpectedCRCresponse = expected => { this.expectedCRCresponse = expected }

    resetMeterInfo = () => {
        this.id = "";
        this.name = "";
        this.isTransparent = false;
        this.isConnected = false;
        this.response = "";
        this.balance = "";
        this.packets = [];
        this.expectedResponse = "";
    }
}

const meter = new Meter();
export default meter;