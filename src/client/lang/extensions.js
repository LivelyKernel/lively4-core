




Date.prototype.dayInWeek = function dayInWeek(offset){
  const day = this.getDay()
  const d = this.getDate();

  const resultDay = new Date(this);
  resultDay.setDate(d-day + offset);

  return resultDay;
}

Date.prototype.mondayInWeek = function mondayInWeek(){ return this.dayInWeek(1); }
Date.prototype.tuesdayInWeek = function tuesdayInWeek(){ return this.dayInWeek(2); }
Date.prototype.wednesdayInWeek = function wednesdayInWeek(){ return this.dayInWeek(3); }
Date.prototype.thursdayInWeek = function thursdayInWeek(){ return this.dayInWeek(4); }
Date.prototype.fridayInWeek = function fridayInWeek(){ return this.dayInWeek(5); }
Date.prototype.saturdayInWeek = function saturdayInWeek(){ return this.dayInWeek(6); }
Date.prototype.sundayInWeek = function sundayInWeek(){ return this.dayInWeek(7); }
