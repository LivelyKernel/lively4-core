/*global jsext, beforeEach, afterEach, describe, it, expect*/

var date = jsext.date;

describe('date', function() {

  it('converts to relative time', function() {
    var d1 = new Date('Tue May 14 2013 14:00:00 GMT-0700 (PDT)'), d2;
    expect(date.relativeTo(d1, d1)).to.equal('now');
    d2 = new Date(d1 - (2 * 1000));
    expect(date.relativeTo(d2, d1)).to.equal('2 secs');
    d2 = new Date(d1 - (60 * 1000 + 2*1000));
    expect(date.relativeTo(d2, d1)).to.equal('1 min 2 secs');
    d2 = new Date(d1 - (3 * 60 * 1000 + 2 * 1000));
    expect(date.relativeTo(d2, d1)).to.equal('3 mins');
    d2 = new Date(d1 - (60 * 60 * 1000 + 2 * 60 * 1000 + 2 * 1000));
    expect(date.relativeTo(d2, d1)).to.equal('1 hour 2 mins');
    d2 = new Date(d1 - (4 *60 * 60 * 1000 + 2 * 60 * 1000 + 2 * 1000));
    expect(date.relativeTo(d2, d1)).to.equal('4 hours');
  });

  it('computes time equality', function() {
    var d1 = new Date('Tue May 14 2013 14:00:00 GMT-0700 (PDT)'), d2;
    expect(date.equals(d1, d1)).to.be(true);
    d2 = new Date(d1 - (2 * 1000));
    expect(date.equals(d1, d2)).to.be(false);
    d2 = new Date(+d1);
    expect(date.equals(d1, d2)).to.be(true);
  });

  it('formats dates', function() {
    var d1 = new Date('Tue May 14 2013 14:00:05 GMT-0700 (PDT)'), d2;
    expect(date.format(d1, "mm/yy HH:MM:ss")).to.equal("05/13 14:00:05");
  });

});

