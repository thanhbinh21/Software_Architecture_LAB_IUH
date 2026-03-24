CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT
);

INSERT INTO users (name, email) VALUES
  ('Alice',   'alice@example.com'),
  ('Bob',     'bob@example.com'),
  ('Charlie', 'charlie@example.com');

CREATE TABLE products (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  price NUMERIC(10,2)
);

INSERT INTO products (name, price) VALUES
  ('Laptop',  999.99),
  ('Mouse',    29.99),
  ('Keyboard', 59.99);