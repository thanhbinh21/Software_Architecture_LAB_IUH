class Library {
  constructor() {
    if (Library.instance) {
      return Library.instance;
    }

    this.books = [];
    Library.instance = this;
  }

  addBook(book) {
    this.books.push(book);
  }

  listBooks() {
    return this.books;
  }
}

module.exports = Library;
