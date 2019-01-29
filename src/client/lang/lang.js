
Object.assign(Date.prototype, {
  
  dayInWeek(offset) {
    const day = this.getDay()
    const d = this.getDate();

    const resultDay = new Date(this);
    resultDay.setDate(d-day + offset);

    return resultDay;
  },

  mondayInWeek(){ return this.dayInWeek(1); },
  tuesdayInWeek(){ return this.dayInWeek(2); },
  wednesdayInWeek(){ return this.dayInWeek(3); },
  thursdayInWeek(){ return this.dayInWeek(4); },
  fridayInWeek(){ return this.dayInWeek(5); },
  saturdayInWeek(){ return this.dayInWeek(6); },
  sundayInWeek(){ return this.dayInWeek(7); },

  toFormattedString(format){
    if (format !== 'yyyy.mm.dd') {
      throw new Error(`Format ${format} not yet supported`);
    }

    function toStringWithTrailingZero(number) {
      return (number < 10 ? "0" : "") + number;
    }

    const year = this.getFullYear();
    const month = toStringWithTrailingZero(this.getMonth() + 1);
    const day = toStringWithTrailingZero(this.getDate());

    return `${year}.${month}.${day}`;
  }
});





Object.assign(Map.prototype, {
  
  /**
   * Tries to get the value stored for the @link(key).
   * If this fails, generate a new value using the povided callback.
   *
   * @public
   * @param key (*) the key to get the value
   * @param createCallback (Function) if no value for @link(key) is available, gets the @link(key) to create a value
   * @returns {*} the value stored for the key
   */
  getOrCreate(key, createCallback) {
    if (!this.has(key)) {
      this.set(key, createCallback(key));
    }

    return this.get(key);
  }
});




