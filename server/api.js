const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const initializeAPI = async (app) => {
  app.post(
    "/api/login",
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
    )
  );
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const result = validationResult(req);
  if (result.isEmpty()) {
    const answer = `
    <h1>Answer</h1>
    <p>Username: ${username}</p>
    <p>Password: ${hash}</p>
  `;
    return res.send(answer);
  }
  const formattedErrors = [];
  result.array().forEach((error) => {
    console.log(error);
    formattedErrors.push({ [error.path]: error.msg });
  });
  res.status(400).json(formattedErrors);
};

module.exports = { initializeAPI };
