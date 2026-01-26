const { PaperBook, EBook, AudioBook } = require("./Book");

class BookFactory {
  static createBook(type, title, author) {
    switch (type) {
      case "paper":
        return new PaperBook(title, author);
      case "ebook":
        return new EBook(title, author);
      case "audio":
        return new AudioBook(title, author);
      default:
        throw new Error("Unknown book type");
    }
  }
}

module.exports = BookFactory;
