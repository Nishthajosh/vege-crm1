-- Auction System Tables
CREATE TABLE IF NOT EXISTS Auction (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL,
  vegetableId TEXT NOT NULL,
  quantity REAL NOT NULL,
  basePrice REAL NOT NULL,
  currentBid REAL,
  highestBidderId TEXT,
  startTime INTEGER NOT NULL,
  endTime INTEGER NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (farmerId) REFERENCES User(id),
  FOREIGN KEY (vegetableId) REFERENCES Vegetable(id),
  FOREIGN KEY (highestBidderId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS Bid (
  id TEXT PRIMARY KEY,
  auctionId TEXT NOT NULL,
  bidderId TEXT NOT NULL,
  amount REAL NOT NULL,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (auctionId) REFERENCES Auction(id),
  FOREIGN KEY (bidderId) REFERENCES User(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_status ON Auction(status);
CREATE INDEX IF NOT EXISTS idx_auction_endTime ON Auction(endTime);
CREATE INDEX IF NOT EXISTS idx_auction_farmer ON Auction(farmerId);
CREATE INDEX IF NOT EXISTS idx_bid_auction ON Bid(auctionId);
CREATE INDEX IF NOT EXISTS idx_bid_bidder ON Bid(bidderId);
CREATE INDEX IF NOT EXISTS idx_bid_auction_amount ON Bid(auctionId, amount DESC);
