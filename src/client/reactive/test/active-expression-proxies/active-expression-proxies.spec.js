"use proxies for aexprs";

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai)
describe('Proxy-based Implementation', () => {

    it('active expressions for simple pobject properties should detect changes', () => {
        const book = { pages: 230, genre: "funny" }
        const spy = sinon.spy();
        const ae = aexpr(() => book.pages);
        ae.onChange(spy);
        book.pages = 320;
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith(320);
    })
  

    it('active expressions should not trigger if property assigment does not change the value of the observed expression', () => {
        const book = { pages: 230, genre: "funny" }
        const spy = sinon.spy();
        const ae = aexpr(() => book.pages);
        ae.onChange(spy);

        book.pages = 230;
      
        expect(spy).to.not.have.been.called;
    })
    it('multiple active expressions depending on the same objects should detect changes', () => {
        const book = { pages: 230, genre: "funny" }
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
    })
    it('active expressions involving simple arithmetic operations should detect changes ', () => {
        const book = { pages: 230, genre: "funny", wordsPerPage: 500 }
        const spy = sinon.spy();
        const ae = aexpr(() => book.pages * book.wordsPerPage);
        ae.onChange(spy);

        book.pages = 320;
        book.wordsPerPage = 400;

        expect(spy).to.have.been.calledTwice;
        expect(spy).to.have.been.calledWith(160000);
        expect(spy).to.have.been.calledWith(128000);
    })
    it('active expressions involving several objects should detect changes ', () => {
        const book = { pages: 230, genre: "funny" }
        const magazine = { pages: 60, genre: "cars" }
        const spy = sinon.spy();
        const ae = aexpr(() => book.pages + magazine.pages);
        ae.onChange(spy);

        book.pages = 320;
        magazine.pages = 70;
      

        expect(spy).to.have.been.calledTwice;
        expect(spy).to.have.been.calledWith(380);
        expect(spy).to.have.been.calledWith(390);
    });

    it('active expressions involving an if statement should detect changes ', () => {
        const book = { pages: 230, title: "Good Book", genre: "funny" }
        const spy = sinon.spy();
        const ae = aexpr(() => {
            if (book.genre === "funny") {
                return book.pages
            }
            return book.title
        })
        ae.onChange(spy);

        book.genre = "sad";

        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith("Good Book");

        spy.reset();

        book.title = "Bad Book";

        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith("Bad Book");


    });

    it('active expressions involving ternary statements should detect changes ', () => {
        const book = { pages: 230, title: "Good Book", genre: "funny" }
        const spy = sinon.spy();
        const ae = aexpr(() => {
            return book.genre === "funny" ? book.pages : book.title;
        })
        ae.onChange(spy);

      
      
        book.genre = "sad";

        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith("Good Book");

      
        spy.reset();

      
        book.title = "Bad Book";

        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith("Bad Book");
    });
  

    xit("active expressions should provide additional information (e.g. the last value of the expression) to the callback", () => {
        const book = { pages: 230, title: "Good Book", genre: "funny" }
        const spy = sinon.spy();

        aexpr(() => book.genre).onChange(spy);

        book.genre = "sad";
        expect(spy).to.have.been.calledOnce;
        expect(spy.getCall(0).args[0]).to.equal(42);
        expect(spy.getCall(0).args[1]).to.have.property('lastValue', 17);
    });
  

    it("all active expressions listening on a property should be checked", () => {
        const book = { pages: 230, title: "Good Book", genre: "funny" }
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
        it('active expressions involving for loops should detect changes ', () => {
            const books = [
                { pages: 230, title: "Good Book", genre: "funny" },
                { pages: 231, title: "Bad Book", genre: "sad" },
                { pages: 232, title: "Odd Book", genre: "weird" },
            ]
            const spy = sinon.spy();
            const ae = aexpr(() => {
                let maxPages = 0;
                for (let bookid = 0; bookid < books.length; bookid++) {
                    if (books[bookid].pages > maxPages) {
                        maxPages = books[bookid].pages
                    }
                }
                return maxPages
            })
            ae.onChange(spy);

            books[0].pages = 300;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(300);

            spy.reset();

            books[0].pages = 100;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(232);
        });

        it('active expressions involving for-of loops should detect changes ', () => {
            const books = [
                { pages: 230, title: "Good Book", genre: "funny" },
                { pages: 231, title: "Bad Book", genre: "sad" },
                { pages: 232, title: "Odd Book", genre: "weird" },
            ]
            const spy = sinon.spy();
            const ae = aexpr(() => {
                let maxPages = 0;
                for (let book of books) {
                    if (book.pages > maxPages) {
                        maxPages = book.pages
                    }
                }
                return maxPages
            })
            ae.onChange(spy);

            books[0].pages = 300;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(300);

            spy.reset();

            books[0].pages = 100;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(232);
        });
    })

    describe("Arrays and Active Expression", () => {

        xit('active expressions involving arrays as object props should detect changes', () => {
            const books = { readers: ["Jonas", "Nico"] };
            const spy = sinon.spy();
            const ae = aexpr(() => books.readers);
            ae.onChange(spy);

            books.readers.push("Stefan");
            books.readers.pop("Nico");

            expect(spy).to.have.been.calledTwice;
            expect(spy).to.have.been.calledWith("Stefan");
            expect(spy).to.have.been.calledWith("Nico");

            spy.reset();
        });


        xit('active expressions involving Array.find should detect changes', () => {
            const books = [
                { pages: 100, title: "Good Book", genre: "funny" },
                { pages: 200, title: "Bad Book", genre: "sad" },
                { pages: 300, title: "Odd Book", genre: "weird" },
            ]
            const spy = sinon.spy();
            const ae = aexpr(() => {
                return books.find((book) => book.pages === "sad")
            })
            ae.onChange(spy);
          
            books[0].pages = 200;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(200);

        });

        xit('active expressions involving unchanged array values should not trigger', () => {
            const jonas = { books: ["myBook", "yourBook"] }
            const spy = sinon.spy();
            const ae = aexpr(() => jonas.books)
            ae.onChange(spy);

            jonas.books = ["myBook", "yourBook"];

            expect(spy).not.to.be.called;
        });

        xit('active expressions involving reduce operations should detect changes ', () => {
            const books = [
                { pages: 100, title: "Good Book", genre: "funny" },
                { pages: 200, title: "Bad Book", genre: "sad" },
                { pages: 300, title: "Odd Book", genre: "weird" },
            ]
            const spy = sinon.spy();
            const ae = aexpr(() => {
                return books.reduce((sumOfPages, book) => sumOfPages + book.pages, 0)
            })
            ae.onChange(spy);

            books[0].pages = 200;

            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(700);

            spy.reset();
        });
    })

    describe("Sets and Active Expression", () => {

        xit('active expressions involving sets as object props should detect changes', () => {
            const books = { readers: new Set(["Jonas", "Nico"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => books.readers)
            ae.onChange(spy);

            books.readers.add("Stefan");
            books.readers.delete("Nico")

            expect(spy).to.have.been.calledTwice;
            expect(spy).to.have.been.calledWith("Stefan");
            expect(spy).to.have.been.calledWith("Nico");

            spy.reset();
        });

        xit('active expressions involving unchanged set values should not trigger', () => {
            const jonas = { books: new Set(["myBook", "yourBook"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => jonas.books)
            ae.onChange(spy);

            jonas.books = new Set(["myBook", "yourBook"]);

            expect(spy).not.to.be.called;
        });

        xit('active expressions involving unchanged set values should not trigger', () => {
            const jonas = { books: new Set(["myBook", "yourBook"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => jonas.books)
            ae.onChange(spy);

            jonas.books = new Set(["yourBook", "myBook"]);

            expect(spy).not.to.be.called;
        });
    })

    describe("Maps and Active Expression", () => {

        xit('active expressions involving maps as object props should detect changes', () => {
            const books = { readers: new Map(["first", "Nico"], ["second", "Jonas"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => books.readers)
            ae.onChange(spy);

            books.readers.set("first", "Stefan");
            books.readers.set("third", "Jens");

            expect(spy).to.have.been.calledTwice;
            expect(spy).to.have.been.calledWith("Stefan");
            expect(spy).to.have.been.calledWith("Jens");

            spy.reset();
        });

        xit('active expressions involving maps as object props should detect changes', () => {
            const books = { readers: new Map(["first", "Nico"], ["second", "Jonas"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => books)
            ae.onChange(spy);

            books.readers = new Map(["first", "Nico"], ["second", "Jonas"]);

            expect(spy).not.to.be.called;

            spy.reset();
        });

        xit('active expressions involving maps as object props should detect changes', () => {
            const books = { readers: new Map(["first", "Nico"], ["second", "Jonas"]) }
            const spy = sinon.spy();
            const ae = aexpr(() => books)
            ae.onChange(spy);

            books.readers = new Map(["second", "Jonas"], ["first", "Nico"]);

            expect(spy).not.to.be.called;

            spy.reset();
        });
    })

    xit('active expression should detect usage of delete of object properties', () => {
        let book = {
            pages: 42,
            genre: "funny"
        };

        expect(delete book.pages).to.be.true;

        expect(book).to.not.have.property('pages');
        expect(book).to.have.property('genre');

        expect(delete book['genre']).to.be.true;

        expect(book).to.not.have.property('pages');
        expect(book).to.not.have.property('genre');
    });

    xit('active expression should detect changes for deleted object properties', () => {
        let book = {
            pages: 42,
            genre: "funny"
        };

        const spy = sinon.spy();
        const ae = aexpr(() => book.pages)
        ae.onChange(spy);

        delete book["pages"]

        expect(spy).to.have.been.calledOnce;

        spy.reset();
      
    });
});
