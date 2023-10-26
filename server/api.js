const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { initializeDatabase, queryDB } = require("./database");
const AesEncryption = require("aes-encryption");
const NodeRSA = require("node-rsa");
const jwt = require("jsonwebtoken");

let db;
const jwtSecret = process.env.JWT_SECRET || "supersecret";
const aes = new AesEncryption();
aes.setSecretKey(
  process.env.SECRET ||
    "11122233344455566677788822244455555555555555555231231321313aaaff"
);

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: "No authorization header." });
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization prefix." });
  }
  const tokenValidation = jwt.verify(token, jwtSecret);
  if (!tokenValidation?.data) {
    return res.status(401).json({ error: "Invalid token." });
  }
  if (!tokenValidation.data.roles?.includes("viewer")) {
    return res.status(403).json({ error: "You are not a viewer." });
  }
  next();
};

const initializeAPI = async (app) => {
  db = initializeDatabase();
  app.post(
    "/api/login",
    body("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isEmail()
      .withMessage("Invalid email format."),
    body("password")
      .isLength({ min: 10, max: 64 })
      .withMessage("Password must be between 10 to 64 characters.")
      .escape(),
    login
  );
  app.get("/api/posts", authMiddleware, getPosts);
  app.post(
    "/api/posts",
    authMiddleware,
    body("title").notEmpty().withMessage("title is required."),
    body("content").notEmpty().withMessage("content is required."),
    createPost
  );
  app.get("/api/keys", getPublicPrivateKey);
};

const login = async (req, res) => {
  // Validate request
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formattedErrors = [];
    result.array().forEach((error) => {
      console.log(error);
      formattedErrors.push({ [error.path]: error.msg });
    });
    return res.status(400).json(formattedErrors);
  }

  // Check if user exists
  const { username, password } = req.body;
  const getUserQuery = `
    SELECT * FROM users WHERE username = '${username}';
  `;
  const user = await queryDB(db, getUserQuery);
  if (user.length === 0) {
    return res
      .status(401)
      .json({ username: "Username does not exist. Or Passwort is incorrect." });
  }
  // Check if password is correct
  const hash = user[0].password;
  const match = await bcrypt.compare(password, hash);
  if (!match) {
    return res
      .status(401)
      .json({ username: "Username does not exist. Or Passwort is incorrect." });
  }
  // Create JWT
  const token = jwt.sign(
    {
      expiresIn: "24h",
      data: { username, roles: [user[0].role] },
    },
    jwtSecret
  );

  return res.send(token);
};

const getPosts = async (req, res) => {
  const posts = await queryDB(db, "SELECT * FROM posts ORDER BY id DESC;");
  for (const post of posts) {
    try {
      const descryptedTitle = aes.decrypt(post.title);
      const descryptedContent = aes.decrypt(post.content);
      post.title = descryptedTitle;
      post.content = descryptedContent;
    } catch {
      console.log("Cannot decrypt post");
    }
  }
  return res.send(posts);
};

const createPost = async (req, res) => {
  const { title, content } = req.body;
  const encryptedTitle = aes.encrypt(title);
  const encryptedContent = aes.encrypt(content);
  const createPostQuery = `
    INSERT INTO posts (title, content) VALUES ('${encryptedTitle}', '${encryptedContent}');
  `;
  await queryDB(db, createPostQuery);
  return res.send({ success: true });
};

getPublicPrivateKey = async (req, res) => {
  const key = new NodeRSA({ b: 1024 });
  const publicKey = key.exportKey("public");
  const privateKey = key.exportKey("private");
  return res.send({ publicKey, privateKey });
};

module.exports = { initializeAPI };
