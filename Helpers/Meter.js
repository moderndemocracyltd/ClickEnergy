class Meter {
    constructor() {
        this.meterId = "";
        this.meterName = "";
        this.isTransparent = false;
        this.meterResponse = "";
        this.meterBalance = "";
    }

    getMeterId = () => this.meterId;
    getMeterName = () => this.meterName;
    getMeterBalance = () => this.meterBalance;
    getMeterResponse = () => this.meterResponse;
    getIsTransparent = () => this.isTransparent;

    setMeterId = id => { this.meterId = id }
    setMeterName = name => { this.meterName = name }
    setMeterBalance = balance => { this.meterBalance = balance }
    setMeterResponse = meterResponse => { this.meterResponse = meterResponse }
    setMeterIsTransparent = transparency => { this.isTransparent = transparency }

    addMeterResponse = response => { this.meterResponse += response }
    clearMeterResponse = () => { this.meterResponse = "" }

    resetMeterInfo = () => {
        this.meterId = "";
        this.meterName = "";
        this.isTransparent = false;
        this.meterResponse = "";
        this.meterBalance = "";
    }
}

const meter = new Meter();
export default meter;