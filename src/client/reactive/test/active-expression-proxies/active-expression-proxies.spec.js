"use proxies for aexprs";
import { reset } from 'active-expression-proxies';

import chai, { expect } from "src/external/chai.js";
import sinon from "src/external/sinon-3.2.1.js";
import sinonChai from "src/external/sinon-chai.js";
chai.use(sinonChai);

describe("Proxy-based Implementation", () => {
  it("active expressions for simple object properties should detect changes", () => {
    const book = { pages: 230, genre: "funny" };
    const spy = sinon.spy();
    const ae = aexpr(() => book.pages);
    ae.onChange(spy);
    book.pages = 320;
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(320);
  });
  it("active expressions should not detect changes after a reset", () => {
    const book = { pages: 230, genre: "funny" };
    const spy = sinon.spy();
    const ae = aexpr(() => book.pages);
    ae.onChange(spy);
    book.pages = 320;    
    reset();
    book.pages = 400;
    
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(320);
  });

  it("active expressions should not trigger if property assigment does not change the value of the observed expression", () => {
    const book = { pages: 230, genre: "funny" };
    const spy = sinon.spy();
    const ae = aexpr(() => book.pages);
    ae.onChange(spy);

    book.pages = 230;

    expect(spy).to.not.have.been.called;
  });
  it("multiple active expressions depending on the same objects should detect changes", () => {
    const book = { pages: 230, genre: "funny" };
    const spy = sinon.spy();
    const another_spy = sinon.spy();
    const ae = aexpr(() => book.pages);
    const another_ae = aexpr(() => book.genre);
    ae.onChange(spy);
    another_ae.onChange(another_spy);

    book.pages = 320;
    book.genre = "sad";

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(320);
    expect(another_spy).to.have.been.calledOnce;
    expect(another_spy).to.have.been.calledWith("sad");
  });
  it("active expressions involving simple arithmetic operations should detect changes ", () => {
    const book = { pages: 230, genre: "funny", wordsPerPage: 500 };
    const spy = sinon.spy();
    const ae = aexpr(() => book.pages * book.wordsPerPage);
    ae.onChange(spy);

    book.pages = 320;
    book.wordsPerPage = 400;

    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWith(160000);
    expect(spy).to.have.been.calledWith(128000);
  });
  it("active expressions involving several objects should detect changes ", () => {
    const book = { pages: 230, genre: "funny" };
    const magazine = { pages: 60, genre: "cars" };
    const spy = sinon.spy();
    const ae = aexpr(() => book.pages + magazine.pages);
    ae.onChange(spy);

    book.pages = 320;
    magazine.pages = 70;

    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWith(380);
    expect(spy).to.have.been.calledWith(390);
  });

  it("active expressions involving an if statement should detect changes ", () => {
    const book = { pages: 230, title: "Good Book", genre: "funny" };
    const spy = sinon.spy();
    const ae = aexpr(() => {
      if (book.genre === "funny") {
        return book.pages;
      }
      return book.title;
    });
    ae.onChange(spy);

    book.genre = "sad";

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith("Good Book");
  });

  it("active expressions involving ternary statements should detect changes ", () => {
    const book = { pages: 230, title: "Good Book", genre: "funny" };
    const spy = sinon.spy();
    const ae = aexpr(() => {
      return book.genre === "funny" ? book.pages : book.title;
    });
    ae.onChange(spy);

    book.genre = "sad";

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith("Good Book");

    spy.reset();

    book.title = "Bad Book";

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith("Bad Book");
  });


  it("all active expressions listening on a property should be checked", () => {
    const book = { pages: 230, title: "Good Book", genre: "funny" };
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();

    aexpr(() => book.genre).onChange(spy1);
    aexpr(() => book.genre).onChange(spy2);
    aexpr(() => book.genre).onChange(spy3);

    book.genre = "sad";

    expect(spy1).to.have.been.calledOnce;
    expect(spy2).to.have.been.calledOnce;
    expect(spy3).to.have.been.calledOnce;
  });

  describe("Loops and Active Expression", () => {
    it("active expressions involving for loops should detect changes ", () => {
      const books = [
        { pages: 230, title: "Good Book", genre: "funny" },
        { pages: 231, title: "Bad Book", genre: "sad" },
        { pages: 232, title: "Odd Book", genre: "weird" }
      ];
      const spy = sinon.spy();
      const ae = aexpr(() => {
        let maxPages = 0;
        for (let bookid = 0; bookid < books.length; bookid++) {
          if (books[bookid].pages > maxPages) {
            maxPages = books[bookid].pages;
          }
        }
        return maxPages;
      });
      ae.onChange(spy);

      books[0].pages = 300;

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(300);

      spy.reset();

      books[0].pages = 100;

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(232);
    });

    it("active expressions involving for-of loops should detect changes ", () => {
      const books = [
        { pages: 230, title: "Good Book", genre: "funny" },
        { pages: 231, title: "Bad Book", genre: "sad" },
        { pages: 232, title: "Odd Book", genre: "weird" }
      ];
      const spy = sinon.spy();
      const ae = aexpr(() => {
        let maxPages = 0;
        for (let book of books) {
          if (book.pages > maxPages) {
            maxPages = book.pages;
          }
        }
        return maxPages;
      });
      ae.onChange(spy);

      books[0].pages = 300;

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(300);

      spy.reset();

      books[0].pages = 100;

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(232);
    });
  });

  describe("Arrays and Active Expression", () => {

    it("active expressions listening to changes for array containers should trigger", () => {
      const books = ["HP", "GOT"];
      const spy = sinon.spy();
      const ae = aexpr(() => books);
      ae.onChange(spy);
      ae.onChange(lively.notify)

      // #TODO: somehow .calledWith cannot properly read the wrapped array (might be due to way its proxied), thus, we got to ask very explicitly for what we want to check
      books.push("LOTR");
      expect(spy).to.have.been.calledOnce;
      var spyCall = spy.getCall(0);
      let firstArgument = spyCall.args[0];
      expect(firstArgument[0]).to.equal("HP")
      expect(firstArgument[1]).to.equal("GOT")
      expect(firstArgument[2]).to.equal("LOTR")

      spy.reset();

      books.pop();
      expect(spy).to.have.been.calledOnce;
      spyCall = spy.getCall(0);
      firstArgument = spyCall.args[0];
      expect(firstArgument[0]).to.equal("HP")
      expect(firstArgument[1]).to.equal("GOT")
      expect(firstArgument[2]).to.equal(undefined)
    });

    it("active expressions involving arrays last property should detect changes", () => {
      const books = ["HP", "GOT"];
      const spy = sinon.spy();
      const ae = aexpr(() => books.last);
      ae.onChange(spy);

      books.push("LOTR");
      books.pop();

      expect(spy).to.have.been.calledTwice;
      expect(spy).to.have.been.calledWith("LOTR");
      expect(spy).to.have.been.calledWith("GOT");
    });

    it("active expressions involving unchanged array values should not trigger", () => {
      let books = ["myBook", "yourBook"];
      const spy = sinon.spy();
      const ae = aexpr(() => books);
      ae.onChange(spy);

      books = ["myBook", "yourBook"];

      expect(spy).not.to.be.called;
    });

    it("active expressions involving reduce operations should detect changes ", () => {
      const booksPages = [100, 200, 300];
      const spy = sinon.spy();
      const ae = aexpr(() => {
        return booksPages.reduce(
          (sumOfPages, bookPages) => sumOfPages + bookPages,
          0
        );
      });
      ae.onChange(spy);

      booksPages.push(100);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(700);

      spy.reset();
    });

    it("active expressions involving map operations should detect changes ", () => {
      const booksPages = [100, 200, 300];
      const spy = sinon.spy();
      const ae = aexpr(() => {
        return booksPages.map(pages => pages).find(item => item > 300);
      });
      ae.onChange(spy);

      booksPages.push(900);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(900);

      spy.reset();
    });

    it("active expressions involving average operations should detect changes ", () => {
      const booksPages = [100, 200, 300];
      const spy = sinon.spy();
      const ae = aexpr(() => booksPages.average());
      ae.onChange(spy);

      booksPages.push(100);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(175);

      spy.reset();
    });

    it("active expressions involving sum operations should detect changes ", () => {
      const booksPages = [100, 200, 300];
      const spy = sinon.spy();
      const ae = aexpr(() => booksPages.sum());
      ae.onChange(spy);

      booksPages.push(100);

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(700);

      spy.reset();
    });
  });

  describe("Sets and Active Expression", () => {

    it("active expressions listening to changes for set containers should trigger", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books);
      ae.onChange(spy);

      books.add("GOT");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(books);
    });

    it("active expressions involving Set.add should detect changes in the size of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.size);
      ae.onChange(spy);

      books.add("GOT");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(3);
      spy.reset();
    });

    it("active expressions involving Set.delete should detect changes in the size of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.size);
      ae.onChange(spy);

      books.delete("LOTR");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(1);
      spy.reset();
    });

    it("active expressions involving Set.clear should detect changes in the size of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.size);
      ae.onChange(spy);

      books.clear();

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Set.add should detect changes in the values() of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.values());
      ae.onChange(spy);

      books.add("GOT");

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Set.delete should detect changes in the values() of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.values());
      ae.onChange(spy);

      books.delete("LOTR");

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Set.clear should detect changes in the values() of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => books.values());
      ae.onChange(spy);

      books.clear();

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Set.add should not detect changes in unchanged internals of the set", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => Array.from(books).first);
      const ae2 = aexpr(() => Array.from(books).last);
      ae.onChange(spy);
      ae2.onChange(spy);

      books.add("HP");

      expect(spy).to.not.have.been.called;
      spy.reset();
    });

    it("active expressions involving Array.from on Sets should detect changes", () => {
      const books = new Set(["HP", "LOTR"]);
      const spy = sinon.spy();
      const ae = aexpr(() => Array.from(books).length);
      ae.onChange(spy);

      books.add("GOT");

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });
  });

  describe("Maps and Active Expression", () => {

    it("active expressions listening to changes for map containers should trigger", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);

      const spy = sinon.spy();
      const ae = aexpr(() => readers);
      ae.onChange(spy);

      readers.set("third", "Stefan");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(readers);
    });

    it("active expressions involving Map.set should detect changes in the size of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.size);
      ae.onChange(spy);
      readers.set("first", "Stefan");
      readers.set("third", "Jens");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(3);

      spy.reset();
    });

    it("active expressions involving Map.clear should detect changes in the size of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.size);
      ae.onChange(spy);

      readers.clear();

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Map.delete should detect changes in the size of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.size);
      ae.onChange(spy);
      readers.delete("first");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(1);

      spy.reset();
    });

    it("active expressions involving Map.set should detect changes in the values() of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.values());
      ae.onChange(spy);

      readers.set("third", "Jens");

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Map.clear should detect changes in the values() of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.values());
      ae.onChange(spy);

      readers.clear();

      expect(spy).to.have.been.calledOnce;
      spy.reset();
    });

    it("active expressions involving Map.delete should detect changes in the values() of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => readers.values());
      ae.onChange(spy);
      readers.delete("first");

      expect(spy).to.have.been.calledOnce;

      spy.reset();
    });

    it("active expressions involving Map.set should not detect changes in unchanged internals of the Map", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => Array.from(readers).first);
      const ae2 = aexpr(() => Array.from(readers).last);
      ae.onChange(spy);
      ae2.onChange(spy);
      readers.set("first", "Nico");

      expect(spy).to.not.have.been.called;

      spy.reset();
    });

    it("active expressions involving Array.from on Maps should detect changes", () => {
      const readers = new Map([
        ["first", "Nico"],
        ["second", "Jonas"]
      ]);
      const spy = sinon.spy();
      const ae = aexpr(() => Array.from(readers).length);
      ae.onChange(spy);

      readers.set("third", "Stefan");

      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith(3);

      spy.reset();
    });
  });

  it("active expression should detect usage of delete of object properties", () => {
    let book = {
      pages: 42,
      genre: "funny"
    };

    expect(delete book.pages).to.be.true;

    expect(book).to.not.have.property("pages");
    expect(book).to.have.property("genre");

    expect(delete book["genre"]).to.be.true;

    expect(book).to.not.have.property("pages");
    expect(book).to.not.have.property("genre");
  });

  it("active expression should detect changes for deleted object properties", () => {
    let book = {
      pages: 42,
      genre: "funny"
    };

    const spy = sinon.spy();
    const ae = aexpr(() => book.pages);
    ae.onChange(spy);

    delete book["pages"];

    expect(spy).to.have.been.calledOnce;

    spy.reset();
  });


  describe("Reset method", () => {
    it("should be able to reset between loop iterations", () => {
      function createRectangle(width = 10, height = 20) {
        return {
          width,
          height,
          area() {
            return this.width * this.height;
          },
          aspectRatio() {
            return this.width / this.height;
          }
        }
      }

      for (let i = 0; i < 5; i++) {
        const targetAspectRatio = 2;
        const rect = createRectangle(20, 10);

        const ae = aexpr(() => rect.aspectRatio());
        ae.onChange(() => (rect.height = rect.width / targetAspectRatio));

        rect.width = 100;
        reset();
      }
    });
  });
});

describe("Descriptor in Objects.define property", () => {
  it("should be unwrapped when is a Proxy", () => {
    const book = {};
    const desciptor = { value: 42 };
    Object.defineProperty(book, "pages", desciptor);

    expect(book.pages).to.equal(42);
  });

  it("should not be wrapped when Object", () => {
    const book = {};
    Object.defineProperty(book, "pages", { value: 42 });

    expect(book.pages).to.equal(42);
  });
});
