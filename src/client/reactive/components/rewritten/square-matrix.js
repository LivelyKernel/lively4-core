"enable aexpr";

export default class Matrix {

  constructor(size) {
    this.size = size;
    this.inner = size.times(() => []);
  }

  get(i, j) {
    return this.inner[i][j];
  }

  set(i, j, value) {
    return this.inner[i][j] = value;
  }

  static init(size, fn) {
    const result = new Matrix(size);
    result.forEach((_, i, j) => {
      result.set(i, j, fn(i, j));
    });
    return result;
  }

  forEach(fn) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        fn(this.get(i, j), i, j, this);
      }
    }
  }

  map(fn) {
    const result = new Matrix(this.size);
    this.forEach((item, i, j) => {
      result.set(i, j, fn(item, i, j, this));
    });
    return result;
  }

  indexOf(item) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.get(i, j) === item) {
          return { i, j };
        }
      }
    }
  }

  getNeighboursOf(i, j) {
    return [{ i: i - 1, j }, { i, j: j - 1 }, { i: i + 1, j }, { i, j: j + 1 }].filter(({ i, j }) => i >= 0 && i < this.size && j >= 0 && j < this.size).map(({ i, j }) => this.get(i, j));
  }

  sumBy(accessor) {
    const iter = iteratee(accessor);

    let sum = 0;
    this.forEach(item => sum += iter(item));
    return sum;
  }

  count(predicate) {
    const iter = iteratee(predicate);

    let counter = 0;
    this.forEach(item => {
      if (iter(item)) {
        counter++;
      }
    });
    return counter;
  }

  toJSON() {
    const json = [];
    this.forEach((item, i, j) => {
      json[i] = json[i] || [];
      json[i][j] = item.toJSON();
    });
    return json;
  }

  static fromJSON(json, builder) {
    if (!Array.isArray(json)) {
      throw new Error('json for Matrix is no Array');
    }

    const iter = iteratee(builder);
    return this.init(json.length, (i, j) => iter(json[i][j]));
  }
}

function iteratee(value) {
  if (typeof value == 'function') {
    return value;
  }

  if (value == null) {
    return Function.identity;
  }

  if (typeof value == 'string') {
    return function (object) {
      return object == null ? undefined : object[value];
    };
  }

  return () => {};
}
