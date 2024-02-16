export default class TimeUtil {
    constructor(t) {
            this.time = t;
    }
      
     addTime(t) {
            this.time+=t;
            return this.time;
        }

    reset(){
        this.time=0;
        return this.time;
    }

    }