class Meter {
    constructor(){
        this.meterId = "";
        this.meterName = "";
        this.isTransparent = false;
        this.meterResponse = "";
        this.meterBalance = "";
    }

    getMeterId() {
        return this.meterId;
    }

    getMeterName() {
        return this.meterName;
    }

    getMeterBalance() {
        return this.meterBalance;
    }

    getMeterResponse() {
        return this.meterResponse;
    }

    getIsTransparent() {
        return this.isTransparent;
    }

    setMeterId(id) {
        this.meterId = id;
    }

    setMeterName(name) {
        this.meterName = name;
    }

    setMeterBalance(balance) {
        this.meterBalance = balance;
    }

    addMeterResponse(response) {
        this.meterResponse += response;
    }

    clearMeterResponse(){
        this.meterResponse = "";
    }

    setIsMeterTransparent(transparency) {
        this.isTransparent = transparency;
    }

    resetMeterInfo(){
        this.meterId = "";
        this.meterName = "";
        this.isTransparent = false;
        this.meterResponse = "";
        this.meterBalance = "";
    }
}

const meter = new Meter();
export default meter;