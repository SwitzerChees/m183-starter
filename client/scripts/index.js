document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const resultText = document.getElementById("result");

  const login = async (username, password) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(username)) {
      resultText.innerHTML = "Invalid E-Mail";
      return;
    }
    if (!password || password.length < 10) {
      resultText.innerHTML = "Password must be at least 10 characters.";
      return;
    }
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.text();
    resultText.insertAdjacentHTML("afterbegin", result);
  };

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    await login(username, password);
  });

  bruteForceButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    while (true) {
      await login(username, password);
    }
  });
});
