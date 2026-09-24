const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD
});

app.get("/", (req, res) => {
	res.send("Backend is running!");
});

app.get("/users", async (req, res) => {
	try {
		const result = await pool.query(
	"SELECT id, name, email FROM users"
);
		res.json(result.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Database error" });
	}
});

app.post("/users", async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await pool.query(
			"INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
			[name, email, hashedPassword]
		);

		res.json(result.rows[0]);
} catch (error) {
    console.error(error);

    if (error.code === "23505") {
        return res.status(409).json({
            error: "Email already registered"
        });
    }

    res.status(500).json({
        error: "Database error"
    });
}
});
app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		const result = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email]
		);

		if (result.rows.length === 0) {
			return res.status(401).json({
				error: "Invalid email or password"
			});
		}

		const user = result.rows[0];

		const passwordMatch = await bcrypt.compare(
			password,
			user.password
		);

		if (!passwordMatch) {
			return res.status(401).json({
				error: "Invalid email or password"
			});
		}

		res.json({
			message: "Login successful",
			user: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "Login failed"
		});
	}
});
const PORT = 5000;

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
