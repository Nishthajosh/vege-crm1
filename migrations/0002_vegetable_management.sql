-- Vegetables table
CREATE TABLE IF NOT EXISTS Vegetable (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT,
  description TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS Order (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  totalPrice REAL NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- OrderItems table (for order details)
CREATE TABLE IF NOT EXISTS OrderItem (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  vegetableId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (orderId) REFERENCES Order(id),
  FOREIGN KEY (vegetableId) REFERENCES Vegetable(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_userId ON Order(userId);
CREATE INDEX IF NOT EXISTS idx_order_date ON Order(date);
CREATE INDEX IF NOT EXISTS idx_orderItem_orderId ON OrderItem(orderId);
CREATE INDEX IF NOT EXISTS idx_orderItem_vegetableId ON OrderItem(vegetableId);
