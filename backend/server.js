console.log("SERVER FILE UPDATED");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Admin authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired admin token",
    });
  }
};

app.use(cors());
app.use(express.json());

// ==========================================
// DATABASE CONNECTION
// ==========================================

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});


console.log("Testing database connection...");

pool.query("SELECT NOW()")
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ==========================================
// GET USERS
// ==========================================

app.get("/users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("USERS ERROR:", error);

    res.status(500).json({
      error: "Database error",
    });
  }
});

// ==========================================
// CUSTOMER REGISTER
// ==========================================

app.post("/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error:
          "Please provide name, email and password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [
        name,
        email,
        hashedPassword,
      ]
    );

    res.status(201).json(
      result.rows[0]
    );
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        error:
          "Email already registered",
      });
    }

    res.status(500).json({
      error: "Database error",
    });
  }
});
// ==========================================
// CUSTOMER AUTHENTICATION MIDDLEWARE
// ==========================================

const requireUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        error: "User authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "user") {
      return res.status(403).json({
        error: "User access required",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired user token",
    });
  }
};

// ==========================================
// CUSTOMER LOGIN
// ==========================================

app.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error:
          "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        error:
          "Invalid email or password",
      });
    }

    // Create customer JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message:
        "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      error: "Login failed",
    });
  }
});

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid admin username or password",
      });
    }

    const admin = result.rows[0];

    const passwordMatches = await bcrypt.compare(
  password,
  admin.password
);

if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid admin username or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message: "Admin login successful",

      token,

      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    res.status(500).json({
      error: "Admin login failed",
    });
  }
});

// ==========================================
// GET PRODUCTS
// ==========================================

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM products
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Could not load products",
    });
  }
});

// ==========================================
// ADD PRODUCT
app.post("/products", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      weight,
      emoji,
      stock,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error:
          "Product name is required",
      });
    }

    if (
      price === undefined ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        error:
          "Valid price is required",
      });
    }

    if (
      stock === undefined ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        error:
          "Valid stock is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO products
       (
         name,
         price,
         weight,
         emoji,
         stock
       )
       VALUES
       ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        Number(price),
        weight || "",
        emoji || "🐟",
        Number(stock),
      ]
    );

    res.status(201).json({
      message:
        "Product added successfully",

      product:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "ADD PRODUCT ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Could not add product",
    });
  }
});

// ==========================================
// UPDATE PRODUCT
// ==========================================
app.put("/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        name,
        price,
        weight,
        emoji,
        stock,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          error:
            "Product name is required",
        });
      }

      if (
        price === undefined ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          error:
            "Valid price is required",
        });
      }

      if (
        stock === undefined ||
        Number(stock) < 0
      ) {
        return res.status(400).json({
          error:
            "Valid stock is required",
        });
      }

      const result =
        await pool.query(
          `UPDATE products
           SET
             name = $1,
             price = $2,
             weight = $3,
             emoji = $4,
             stock = $5
           WHERE id = $6
           RETURNING *`,
          [
            name,
            Number(price),
            weight || "",
            emoji || "🐟",
            Number(stock),
            id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Product not found",
        });
      }

      res.json({
        message:
          "Product updated successfully",

        product:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Could not update product",
      });
    }
  }
);

// ==========================================
// DELETE PRODUCT
// ==========================================

app.delete("/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } =
        req.params;

      const result =
        await pool.query(
          `DELETE FROM products
           WHERE id = $1
           RETURNING *`,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Product not found",
        });
      }

      res.json({
        message:
          "Product deleted successfully",

        product:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Could not delete product",
      });
    }
  }
);

// ==========================================
// CREATE ORDER
// ==========================================
// Stock is checked and reduced automatically.
// A transaction protects the stock and order.

app.post("/orders", async (req, res) => {
  const {
    userId,
    customerName,
    phone,
    address,
    city,
    pinCode,
    items,
    totalAmount,
  } = req.body;

  // --------------------------------------
  // VALIDATE CUSTOMER DETAILS
  // --------------------------------------

  if (!customerName) {
    return res.status(400).json({
      error:
        "Customer name is required",
    });
  }

  if (!phone) {
    return res.status(400).json({
      error:
        "Phone is required",
    });
  }

  if (!address) {
    return res.status(400).json({
      error:
        "Address is required",
    });
  }

  if (!city) {
    return res.status(400).json({
      error:
        "City is required",
    });
  }

  if (!pinCode) {
    return res.status(400).json({
      error:
        "PIN code is required",
    });
  }

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      error:
        "Cart items are required",
    });
  }

  const client =
    await pool.connect();

  try {
    console.log(
      "========== NEW ORDER =========="
    );

    console.log(req.body);

    // --------------------------------------
    // START TRANSACTION
    // --------------------------------------

    await client.query("BEGIN");

    // --------------------------------------
    // CHECK STOCK
    // --------------------------------------

    for (const item of items) {
      const productResult =
        await client.query(
          `SELECT
             id,
             name,
             price,
             stock
           FROM products
           WHERE id = $1
           FOR UPDATE`,
          [item.id]
        );

      if (
        productResult.rows.length === 0
      ) {
        throw new Error(
          `Product "${item.name}" was not found.`
        );
      }

      const product =
        productResult.rows[0];

      const requestedQuantity =
        Number(item.quantity);

      const availableStock =
        Number(product.stock);

      if (
        !Number.isInteger(
          requestedQuantity
        ) ||
        requestedQuantity <= 0
      ) {
        throw new Error(
          `Invalid quantity for "${product.name}".`
        );
      }

      if (
        requestedQuantity >
        availableStock
      ) {
        throw new Error(
          `Only ${availableStock} item(s) of "${product.name}" are available.`
        );
      }
    }

    // --------------------------------------
    // REDUCE STOCK
    // --------------------------------------

    for (const item of items) {
      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [
          Number(item.quantity),
          item.id,
        ]
      );
    }

    // --------------------------------------
    // CREATE ORDER
    // --------------------------------------

    const orderResult =
      await client.query(
        `INSERT INTO orders
         (
           customer_name,
           phone,
           address,
           city,
           pin_code,
           items,
           total_amount,
           status,
           user_id
         )
         VALUES
         (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9
         )
         RETURNING *`,
        [
          customerName,
          phone,
          address,
          city,
          pinCode,
          JSON.stringify(items),
          Number(totalAmount),
          "Pending",
          userId || null,
        ]
      );

    // --------------------------------------
    // COMMIT
    // --------------------------------------

    await client.query(
      "COMMIT"
    );

    console.log(
      "ORDER CREATED:",
      orderResult.rows[0]
    );

    res.status(201).json({
      message:
        "Order created successfully",

      order:
        orderResult.rows[0],
    });
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "ORDER ERROR:",
      error
    );

    res.status(400).json({
      error:
        error.message ||
        "Could not create order",
    });
  } finally {
    client.release();
  }
});

// ==========================================
// GET ALL ORDERS - ADMIN
// ==========================================

app.get(
  "/orders",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM orders
         ORDER BY created_at DESC`
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "GET ALL ORDERS ERROR:",
        error
      );

      res.status(500).json({
        error: "Could not get orders",
      });
    }
  }
);

// ==========================================
// GET CUSTOMER ORDERS
// ==========================================

app.get(
  "/orders/user/:userId",
  requireUser,
  async (req, res) => {
    try {
      if (req.user.id !== Number(req.params.userId)) {
  return res.status(403).json({
    error: "You can only access your own orders",
  });
}
      const {
        userId,
      } = req.params;

      const result =
        await pool.query(
          `SELECT *
           FROM orders
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        );

      res.json(
        result.rows
      );
    } catch (error) {
      console.error(
        "GET CUSTOMER ORDERS ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Could not get customer orders",
      });
    }
  }
);

// ==========================================
// UPDATE ORDER STATUS
// ==========================================
// Includes automatic stock restoration
// when an order is cancelled.
app.put(
  "/orders/:id/delivery-details",
  requireAdmin,
  async (req, res) => {
    const {
      id,
    } = req.params;

    const {
      status,
    } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    // Validate before opening a DB connection
    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid order status",
      });
    }

    const client =
      await pool.connect();

    try {
      // ------------------------------------
      // START TRANSACTION
      // ------------------------------------

      await client.query(
        "BEGIN"
      );

      // ------------------------------------
      // GET CURRENT ORDER
      // ------------------------------------

      const orderResult =
        await client.query(
          `SELECT *
           FROM orders
           WHERE id = $1
           FOR UPDATE`,
          [id]
        );

      if (
        orderResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          error:
            "Order not found",
        });
      }

      const order =
        orderResult.rows[0];

      // ------------------------------------
      // ALREADY CANCELLED
      // ------------------------------------

      if (
        order.status ===
          "Cancelled" &&
        status === "Cancelled"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            "This order is already cancelled.",
        });
      }

      // ------------------------------------
      // CANNOT CHANGE CANCELLED ORDER
      // ------------------------------------

      if (
        order.status ===
        "Cancelled"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            "A cancelled order cannot be changed.",
        });
      }

      // ------------------------------------
      // CANCEL ORDER
      // ------------------------------------

      if (
        status === "Cancelled"
      ) {
        let items =
          order.items;

        if (
          typeof items ===
          "string"
        ) {
          items =
            JSON.parse(items);
        }

        if (
          !Array.isArray(items)
        ) {
          throw new Error(
            "Order items are invalid."
          );
        }

        // Restore stock
        for (
          const item of items
        ) {
          const quantity =
            Number(
              item.quantity
            );

          if (
            !Number.isInteger(
              quantity
            ) ||
            quantity <= 0
          ) {
            throw new Error(
              `Invalid quantity for ${item.name}.`
            );
          }

          const productResult =
            await client.query(
              `UPDATE products
               SET stock = stock + $1
               WHERE id = $2
               RETURNING id, name, stock`,
              [
                quantity,
                item.id,
              ]
            );

          if (
            productResult.rows
              .length === 0
          ) {
            throw new Error(
              `Product "${item.name}" no longer exists.`
            );
          }

          console.log(
            `Restored ${quantity} stock for ${item.name}`
          );
        }
      }

      // ------------------------------------
      // UPDATE ORDER STATUS
      // ------------------------------------

      const updatedOrder =
        await client.query(
          `UPDATE orders
           SET status = $1
           WHERE id = $2
           RETURNING *`,
          [
            status,
            id,
          ]
        );

      // ------------------------------------
      // COMMIT
      // ------------------------------------

      await client.query(
        "COMMIT"
      );

      console.log(
        `Order ${id} status changed from ${order.status} to ${status}`
      );

      res.json({
        message:
          "Order status updated successfully",

        order:
          updatedOrder.rows[0],
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "Could not update order status",
      });
    } finally {
      client.release();
    }
  }
);

// ==========================================
// UPDATE DELIVERY DETAILS
// ==========================================
// Admin can save/update:
// 1. Delivery date
// 2. Tracking number

app.put(
  "/orders/:id/delivery",
  requireAdmin,
  async (req, res) => {

    try {
      const {
        id,
      } = req.params;

      const {
        deliveryDate,
        trackingNumber,
      } = req.body;

      // ------------------------------------
      // VALIDATE ORDER ID
      // ------------------------------------

      if (
        !id ||
        isNaN(Number(id))
      ) {
        return res.status(400).json({
          error:
            "Valid order ID is required",
        });
      }

      // ------------------------------------
      // UPDATE DELIVERY DETAILS
      // ------------------------------------

      const result =
        await pool.query(
          `UPDATE orders
           SET
             delivery_date = $1,
             tracking_number = $2
           WHERE id = $3
           RETURNING *`,
          [
            deliveryDate || null,
            trackingNumber
              ? String(
                  trackingNumber
                ).trim()
              : null,
            id,
          ]
        );

      // ------------------------------------
      // ORDER NOT FOUND
      // ------------------------------------

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Order not found",
        });
      }

      // ------------------------------------
      // SUCCESS
      // ------------------------------------

      res.json({
        message:
          "Delivery details updated successfully",

        order:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "UPDATE DELIVERY ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Could not update delivery details",
      });
    }
  }
);

// ==========================================
// START SERVER
// ==========================================


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
