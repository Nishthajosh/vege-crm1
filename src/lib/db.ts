// D1 Database client for Cloudflare D1
// In development, this will use local SQLite
// In production (Cloudflare Pages), this will use D1 binding

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

interface D1Result<T = any> {
  success: boolean;
  meta: {
    changes: number;
    last_insert_rowid: number;
    duration: number;
  };
  results?: T[];
}

// Types for our database models
export interface User {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: number; // SQLite stores booleans as integers
  emailVerificationToken: string | null;
  emailVerificationExpires: number | null;
  createdAt: number;
}

export interface Vegetable {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  createdAt: number;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  name: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  vegetableId: string;
  quantity: number;
  price: number;
}

// Get D1 database instance
// This will be available in Cloudflare Workers/Pages environment
function getD1Database(): D1Database | null {
  // For Cloudflare Pages/Workers, D1 is available via runtime env
  // In Next.js with @cloudflare/next-on-pages, it's available via process.env
  if (typeof process !== 'undefined') {
    // Check for Cloudflare Pages binding (when using @cloudflare/next-on-pages)
    if ((process.env as any).DB) {
      return (process.env as any).DB;
    }
    // Check for direct binding in request context (for API routes)
    const requestContext = (globalThis as any).__CF_PAGES__;
    if (requestContext?.env?.DB) {
      return requestContext.env.DB;
    }
  }
  
  // For Cloudflare Workers runtime
  if (typeof (globalThis as any).DB !== 'undefined') {
    return (globalThis as any).DB;
  }
  
  // For local development with Wrangler, check for --local binding
  // Note: For local development, use `wrangler pages dev` to access D1
  return null;
}

export const db = {
  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getUserByEmail(email);
    }
    
    const result = await database
      .prepare('SELECT * FROM User WHERE email = ?')
      .bind(email)
      .first<User>();
    
    return result || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getUserById(id);
    }
    
    const result = await database
      .prepare('SELECT * FROM User WHERE id = ?')
      .bind(id)
      .first<User>();
    
    return result || null;
  },

  async getUserByVerificationToken(token: string): Promise<User | null> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getUserByVerificationToken(token);
    }
    
    const result = await database
      .prepare('SELECT * FROM User WHERE emailVerificationToken = ? AND emailVerificationExpires > ?')
      .bind(token, Date.now())
      .first<User>();
    
    return result || null;
  },

  async createUser(data: {
    id: string;
    email: string;
    password: string;
    name?: string;
    emailVerificationToken: string;
    emailVerificationExpires: number;
  }): Promise<User> {
    const database = getD1Database();
    if (!database) {
      return mockDb.createUser(data);
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    await database
      .prepare(
        'INSERT INTO User (id, email, password, name, role, emailVerified, emailVerificationToken, emailVerificationExpires, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        data.id,
        data.email,
        data.password,
        data.name || null,
        'user',
        0,
        data.emailVerificationToken,
        data.emailVerificationExpires,
        now
      )
      .run();
    
    const user = await this.getUserById(data.id);
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const database = getD1Database();
    if (!database) {
      return mockDb.updateUser(id, data);
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      values.push(data.password);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      values.push(data.image);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.emailVerified !== undefined) {
      updates.push('emailVerified = ?');
      values.push(data.emailVerified);
    }
    if (data.emailVerificationToken !== undefined) {
      updates.push('emailVerificationToken = ?');
      values.push(data.emailVerificationToken);
    }
    if (data.emailVerificationExpires !== undefined) {
      updates.push('emailVerificationExpires = ?');
      values.push(data.emailVerificationExpires);
    }
    
    if (updates.length === 0) {
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }
    
    values.push(id);
    
    await database
      .prepare(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  },

  // Vegetable operations
  async getAllVegetables(): Promise<Vegetable[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getAllVegetables();
    }
    
    const result = await database
      .prepare('SELECT * FROM Vegetable ORDER BY createdAt DESC')
      .all<Vegetable>();
    
    return result.results || [];
  },

  async getVegetableById(id: string): Promise<Vegetable | null> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getVegetableById(id);
    }
    
    const result = await database
      .prepare('SELECT * FROM Vegetable WHERE id = ?')
      .bind(id)
      .first<Vegetable>();
    
    return result || null;
  },

  async createVegetable(data: {
    id: string;
    name: string;
    price: number;
    image?: string;
    description?: string;
  }): Promise<Vegetable> {
    const database = getD1Database();
    if (!database) {
      return mockDb.createVegetable(data);
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    await database
      .prepare(
        'INSERT INTO Vegetable (id, name, price, image, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(
        data.id,
        data.name,
        data.price,
        data.image || null,
        data.description || null,
        now
      )
      .run();
    
    const vegetable = await this.getVegetableById(data.id);
    if (!vegetable) {
      throw new Error('Failed to create vegetable');
    }
    
    return vegetable;
  },

  async updateVegetable(id: string, data: Partial<Vegetable>): Promise<Vegetable> {
    const database = getD1Database();
    if (!database) {
      return mockDb.updateVegetable(id, data);
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      values.push(data.image);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    
    if (updates.length === 0) {
      const vegetable = await this.getVegetableById(id);
      if (!vegetable) {
        throw new Error('Vegetable not found');
      }
      return vegetable;
    }
    
    values.push(id);
    
    await database
      .prepare(`UPDATE Vegetable SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    
    const vegetable = await this.getVegetableById(id);
    if (!vegetable) {
      throw new Error('Vegetable not found');
    }
    
    return vegetable;
  },

  async deleteVegetable(id: string): Promise<void> {
    const database = getD1Database();
    if (!database) {
      return mockDb.deleteVegetable(id);
    }
    
    await database
      .prepare('DELETE FROM Vegetable WHERE id = ?')
      .bind(id)
      .run();
  },

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getAllOrders();
    }
    
    const result = await database
      .prepare('SELECT * FROM Order ORDER BY createdAt DESC')
      .all<Order>();
    
    return result.results || [];
  },

  async getOrderById(id: string): Promise<Order | null> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getOrderById(id);
    }
    
    const result = await database
      .prepare('SELECT * FROM Order WHERE id = ?')
      .bind(id)
      .first<Order>();
    
    return result || null;
  },

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getOrdersByUserId(userId);
    }
    
    const result = await database
      .prepare('SELECT * FROM Order WHERE userId = ? ORDER BY createdAt DESC')
      .bind(userId)
      .all<Order>();
    
    return result.results || [];
  },

  async createOrder(data: {
    id: string;
    userId: string;
    date: string;
    name: string;
    quantity: number;
    totalPrice: number;
    status?: string;
  }): Promise<Order> {
    const database = getD1Database();
    if (!database) {
      return mockDb.createOrder(data);
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    await database
      .prepare(
        'INSERT INTO Order (id, userId, date, name, quantity, totalPrice, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        data.id,
        data.userId,
        data.date,
        data.name,
        data.quantity,
        data.totalPrice,
        data.status || 'pending',
        now
      )
      .run();
    
    const order = await this.getOrderById(data.id);
    if (!order) {
      throw new Error('Failed to create order');
    }
    
    return order;
  },

  async createOrderItem(data: {
    id: string;
    orderId: string;
    vegetableId: string;
    quantity: number;
    price: number;
  }): Promise<OrderItem> {
    const database = getD1Database();
    if (!database) {
      return mockDb.createOrderItem(data);
    }
    
    await database
      .prepare(
        'INSERT INTO OrderItem (id, orderId, vegetableId, quantity, price) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        data.id,
        data.orderId,
        data.vegetableId,
        data.quantity,
        data.price
      )
      .run();
    
    const result = await database
      .prepare('SELECT * FROM OrderItem WHERE id = ?')
      .bind(data.id)
      .first<OrderItem>();
    
    if (!result) {
      throw new Error('Failed to create order item');
    }
    
    return result;
  },

  async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getOrderItemsByOrderId(orderId);
    }
    
    const result = await database
      .prepare('SELECT * FROM OrderItem WHERE orderId = ?')
      .bind(orderId)
      .all<OrderItem>();
    
    return result.results || [];
  },

  // Statistics operations
  async getUsersByRole(role: string): Promise<number> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getUsersByRole(role);
    }
    
    const result = await database
      .prepare('SELECT COUNT(*) as count FROM User WHERE role = ?')
      .bind(role)
      .first<{ count: number }>();
    
    return result?.count || 0;
  },

  async getTotalOrders(): Promise<number> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getTotalOrders();
    }
    
    const result = await database
      .prepare('SELECT COUNT(*) as count FROM Order')
      .first<{ count: number }>();
    
    return result?.count || 0;
  },

  async getTotalVegetables(): Promise<number> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getTotalVegetables();
    }
    
    const result = await database
      .prepare('SELECT COUNT(*) as count FROM Vegetable')
      .first<{ count: number }>();
    
    return result?.count || 0;
  },

  async getAllUsers(): Promise<User[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getAllUsers();
    }
    
    const result = await database
      .prepare('SELECT * FROM User')
      .all<User>();
    
    return result?.results || [];
  },

  async getAllOrderItems(): Promise<OrderItem[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getAllOrderItems();
    }
    
    const result = await database
      .prepare('SELECT * FROM OrderItem')
      .all<OrderItem>();
    
    return result?.results || [];
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const database = getD1Database();
    if (!database) {
      return mockDb.getOrderItems(orderId);
    }
    
    const result = await database
      .prepare('SELECT * FROM OrderItem WHERE orderId = ?')
      .bind(orderId)
      .all<OrderItem>();
    
    return result?.results || [];
  },
};

// In-memory mock database for local development
export const mockDb = (() => {
  const users = new Map<string, User>();
  const vegetables = new Map<string, Vegetable>();
  const orders = new Map<string, Order>();
  const orderItems = new Map<string, OrderItem>();

  // Start with test accounts
  const now = Math.floor(Date.now() / 1000);
  
  // Add test user accounts (password: password123 for all)
  // Hash for "password123": $2b$12$8IbtbKvnOvh4EOrgnU07rebkMtiBzBf7t9VHRWwOq3bU3GOAvJRQO
  const testUsers: User[] = [
    {
      id: 'user_test_1',
      email: 'siddhijani33@gmail.com',
      password: '$2b$12$8IbtbKvnOvh4EOrgnU07rebkMtiBzBf7t9VHRWwOq3bU3GOAvJRQO',
      name: 'Siddhi Jani',
      image: null,
      role: 'broker',
      emailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      createdAt: now,
    },
    {
      id: 'user_test_2',
      email: 'farmer@test.com',
      password: '$2b$12$8IbtbKvnOvh4EOrgnU07rebkMtiBzBf7t9VHRWwOq3bU3GOAvJRQO',
      name: 'Test Farmer',
      image: null,
      role: 'farmer',
      emailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      createdAt: now,
    },
    {
      id: 'user_test_3',
      email: 'retailer@test.com',
      password: '$2b$12$8IbtbKvnOvh4EOrgnU07rebkMtiBzBf7t9VHRWwOq3bU3GOAvJRQO',
      name: 'Test Retailer',
      image: null,
      role: 'retailer',
      emailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      createdAt: now,
    },
  ];
  
  testUsers.forEach(user => users.set(user.id, user));

  // Add sample vegetables
  const sampleVegetables: Vegetable[] = [
    {
      id: 'veg_1',
      name: 'Tomato',
      price: 45.50,
      image: '/vegetables/tomato.svg',
      description: 'Fresh red tomatoes',
      createdAt: now,
    },
    {
      id: 'veg_2',
      name: 'Potato',
      price: 30.00,
      image: '/vegetables/potato.svg',
      description: 'Fresh potatoes',
      createdAt: now,
    },
    {
      id: 'veg_3',
      name: 'Onion',
      price: 35.75,
      image: '/vegetables/onion.svg',
      description: 'Fresh onions',
      createdAt: now,
    },
    {
      id: 'veg_4',
      name: 'Carrot',
      price: 40.00,
      image: '/vegetables/carrot.svg',
      description: 'Fresh carrots',
      createdAt: now,
    },
    {
      id: 'veg_5',
      name: 'Cabbage',
      price: 25.50,
      image: '/vegetables/cabbage.svg',
      description: 'Fresh green cabbage',
      createdAt: now,
    },
  ];
  
  sampleVegetables.forEach(veg => vegetables.set(veg.id, veg));

  // Add sample orders
  const todayDate = new Date().toISOString().split('T')[0];
  const sampleOrders: Order[] = [
    {
      id: 'order_1',
      userId: 'user_test_3',
      date: todayDate,
      name: 'Test Retailer',
      status: 'pending',
      totalPrice: 250.00,
      quantity: 10,
      createdAt: now - 3600,
    },
    {
      id: 'order_2',
      userId: 'user_test_3',
      date: todayDate,
      name: 'Test Retailer',
      status: 'completed',
      totalPrice: 180.50,
      quantity: 8,
      createdAt: now - 7200,
    },
  ];
  
  sampleOrders.forEach(order => orders.set(order.id, order));

  // Add sample order items
  const sampleOrderItems: OrderItem[] = [
    {
      id: 'item_1',
      orderId: 'order_1',
      vegetableId: 'veg_1',
      quantity: 5,
      price: 45.50,
    },
    {
      id: 'item_2',
      orderId: 'order_1',
      vegetableId: 'veg_2',
      quantity: 5,
      price: 30.00,
    },
    {
      id: 'item_3',
      orderId: 'order_2',
      vegetableId: 'veg_3',
      quantity: 4,
      price: 35.75,
    },
    {
      id: 'item_4',
      orderId: 'order_2',
      vegetableId: 'veg_4',
      quantity: 4,
      price: 40.00,
    },
  ];
  
  sampleOrderItems.forEach(item => orderItems.set(item.id, item));

  return {
    async getUserByEmail(email: string): Promise<User | null> {
      for (const user of users.values()) {
        if (user.email === email) return user;
      }
      return null;
    },
    async getUserById(id: string): Promise<User | null> {
      return users.get(id) || null;
    },
    async getUserByVerificationToken(token: string): Promise<User | null> {
      for (const user of users.values()) {
        if (user.emailVerificationToken === token && (user.emailVerificationExpires || 0) > Date.now()) {
          return user;
        }
      }
      return null;
    },
    async createUser(data: { id: string; email: string; password: string; name?: string; emailVerificationToken: string; emailVerificationExpires: number; }): Promise<User> {
      const user: User = {
        id: data.id,
        email: data.email,
        password: data.password,
        name: data.name || null,
        image: null,
        role: 'user',
        emailVerified: 0,
        emailVerificationToken: data.emailVerificationToken,
        emailVerificationExpires: data.emailVerificationExpires,
        createdAt: Math.floor(Date.now() / 1000),
      };
      users.set(user.id, user);
      return user;
    },
    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const existing = users.get(id);
      if (!existing) throw new Error('User not found');
      const updated: User = { ...existing, ...data } as User;
      users.set(id, updated);
      return updated;
    },

    async getAllVegetables(): Promise<Vegetable[]> {
      return Array.from(vegetables.values()).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getVegetableById(id: string): Promise<Vegetable | null> {
      return vegetables.get(id) || null;
    },
    async createVegetable(data: { id: string; name: string; price: number; image?: string; description?: string; }): Promise<Vegetable> {
      const veg: Vegetable = {
        id: data.id,
        name: data.name,
        price: data.price,
        image: data.image || null,
        description: data.description || null,
        createdAt: Math.floor(Date.now() / 1000),
      };
      vegetables.set(veg.id, veg);
      return veg;
    },
    async updateVegetable(id: string, data: Partial<Vegetable>): Promise<Vegetable> {
      const existing = vegetables.get(id);
      if (!existing) throw new Error('Vegetable not found');
      const updated: Vegetable = { ...existing, ...data } as Vegetable;
      vegetables.set(id, updated);
      return updated;
    },
    async deleteVegetable(id: string): Promise<void> {
      vegetables.delete(id);
    },

    async getAllOrders(): Promise<Order[]> {
      return Array.from(orders.values()).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getOrderById(id: string): Promise<Order | null> {
      return orders.get(id) || null;
    },
    async getOrdersByUserId(userId: string): Promise<Order[]> {
      return Array.from(orders.values()).filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    },
    async createOrder(data: { id: string; userId: string; date: string; name: string; quantity: number; totalPrice: number; status?: string; }): Promise<Order> {
      const order: Order = {
        id: data.id,
        userId: data.userId,
        date: data.date,
        name: data.name,
        quantity: data.quantity,
        totalPrice: data.totalPrice,
        status: data.status || 'pending',
        createdAt: Math.floor(Date.now() / 1000),
      };
      orders.set(order.id, order);
      return order;
    },
    async createOrderItem(data: { id: string; orderId: string; vegetableId: string; quantity: number; price: number; }): Promise<OrderItem> {
      const item: OrderItem = { ...data };
      orderItems.set(item.id, item);
      return item;
    },
    async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
      return Array.from(orderItems.values()).filter(i => i.orderId === orderId);
    },
    async getOrderItems(orderId: string): Promise<OrderItem[]> {
      return Array.from(orderItems.values()).filter(i => i.orderId === orderId);
    },
    async getAllOrderItems(): Promise<OrderItem[]> {
      return Array.from(orderItems.values());
    },

    async getAllUsers(): Promise<User[]> {
      return Array.from(users.values());
    },
    async getUsersByRole(role: string): Promise<number> {
      let count = 0;
      for (const u of users.values()) {
        if (u.role === role) count++;
      }
      return count;
    },
    async getTotalOrders(): Promise<number> {
      return orders.size;
    },
    async getTotalVegetables(): Promise<number> {
      return vegetables.size;
    },
  };
})();
