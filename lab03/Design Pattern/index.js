const Library = require("./Library");
const BookFactory = require("./BookFactory");

const library1 = new Library();
const library2 = new Library();

console.log(library1 === library2); // true ✅ Singleton

const book1 = BookFactory.createBook("paper", "Clean Code", "Robert Martin");
const book2 = BookFactory.createBook("ebook", "Design Patterns", "GoF");
const book3 = BookFactory.createBook("audio", "Atomic Habits", "James Clear");

library1.addBook(book1);
library1.addBook(book2);
library1.addBook(book3);

console.log(library2.listBooks());
