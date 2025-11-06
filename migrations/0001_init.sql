-- Users table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  emailVerified INTEGER DEFAULT 0,
  emailVerificationToken TEXT,
  emailVerificationExpires INTEGER,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);

-- Create index on emailVerificationToken for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_verification_token ON User(emailVerificationToken);

