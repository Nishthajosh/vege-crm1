const bcrypt = require("bcryptjs");

async function generatePasswordHash() {
  const password = process.argv[2];

  if (!password) {
    console.log("Usage: node scripts/generate-password.js <password>");
    console.log("Example: node scripts/generate-password.js myadminpassword");
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    console.log("Password hash for .env file:");
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log("\nCopy this line to your .env file");
  } catch (error) {
    console.error("Error generating password hash:", error);
    process.exit(1);
  }
}

generatePasswordHash();
