class Book {
  constructor(title, author) {
    this.title = title;
    this.author = author;
  }
}

class PaperBook extends Book {
  getType() {
    return "Paper Book";
  }
}

class EBook extends Book {
  getType() {
    return "E-Book";
  }
}

class AudioBook extends Book {
  getType() {
    return "Audio Book";
  }
}

module.exports = { PaperBook, EBook, AudioBook };
