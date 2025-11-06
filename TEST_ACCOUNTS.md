# Test Accounts for Vegetable CRM

## Available Test Accounts

All test accounts use the password: **`password123`**

### 1. Broker Account (Main)
- **Email**: `siddhijani33@gmail.com`
- **Password**: `password123`
- **Role**: Broker
- **Name**: Siddhi Jani

### 2. Farmer Account
- **Email**: `farmer@test.com`
- **Password**: `password123`
- **Role**: Broker
- **Name**: Test Farmer

### 3. Retailer Account
- **Email**: `retailer@test.com`
- **Password**: `password123`
- **Role**: Retailer
- **Name**: Test Retailer

## Sample Data Included

### Vegetables
1. **Tomato** - ₹45.50 - Fresh red tomatoes
2. **Potato** - ₹30.00 - Fresh potatoes
3. **Onion** - ₹35.75 - Fresh onions
4. **Carrot** - ₹40.00 - Fresh carrots
5. **Cabbage** - ₹25.50 - Fresh green cabbage

### Orders
- **Order 1**: Test Retailer - 10 items - ₹250.00 (Pending)
  - 5x Tomato @ ₹45.50
  - 5x Potato @ ₹30.00

- **Order 2**: Test Retailer - 8 items - ₹180.50 (Completed)
  - 4x Onion @ ₹35.75
  - 4x Carrot @ ₹40.00

## How to Use

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. You'll be redirected to the login page

4. Enter any of the test account credentials above

5. After logging in, you'll see the dashboard with:
   - 7 metric cards showing statistics
   - Recent Orders table
   - Today's Vegetables table

## Note

The application is currently running in **mock mode** with in-memory data. To connect to a real Cloudflare D1 database:

1. Set up Cloudflare Pages
2. Create a D1 database
3. Run the migrations from `/migrations` folder
4. Update `src/app/dashboard/page.tsx` - change `useMock = true` to `useMock = false`
