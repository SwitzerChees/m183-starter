const escapeHTML = (str) =>
  str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[tag] || tag)
  );

document.addEventListener("DOMContentLoaded", async () => {
  const feed = document.getElementById("feed");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const logoutButton = document.getElementById("logout");

  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const postButton = document.getElementById("sendPost");
  postContainer = document.getElementById("postContainer");

  let keys;

  const getPosts = async () => {
    if (!sessionStorage.getItem("token")) {
      logoutButton.classList.add("hidden");
      postContainer.classList.add("hidden");
      return;
    }
    feed.innerHTML = "";
    const response = await fetch("/api/posts", {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });
    const posts = await response.json();
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(keys.privateKey);
    for (const post of posts) {
      post.title = decrypt.decrypt(post.title);
      if (post.title) post.title = escapeHTML(post.title);
      post.content = decrypt.decrypt(post.content);
      if (post.content) post.content = escapeHTML(post.content);

      const postElement = document.createElement("div");
      postElement.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
      `;
      feed.appendChild(postElement);
    }
  };

  const getKeys = async () => {
    if (!sessionStorage.getItem("token")) return;
    if (localStorage.getItem("keys")) {
      keys = JSON.parse(localStorage.getItem("keys"));
      return;
    }
    const response = await fetch("/api/keys", {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });
    if (response.status !== 200) {
      feed.innerHTML = `Something went wrong. Error: ${response.status}`;
      return;
    }
    keys = await response.json();
    localStorage.setItem("keys", JSON.stringify(keys));
  };
  await getKeys();
  await getPosts();

  const login = async (username, password) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(username)) {
      feed.innerHTML = "Invalid E-Mail";
      return;
    }
    if (!password || password.length < 10) {
      feed.innerHTML = "Password must be at least 10 characters.";
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
    if (!result) return;
    sessionStorage.setItem("token", result);
    logoutButton.classList.remove("hidden");
    postContainer.classList.remove("hidden");
    await getKeys();
    await getPosts();
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

  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    location.reload();
  });

  postButton.addEventListener("click", async () => {
    if (!titleInput.value || !contentInput.value) {
      feed.innerHTML = "Please fill out all fields.";
      return;
    }
    try {
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(keys.publicKey);
      const encryptedTitle = encrypt.encrypt(titleInput.value);
      const encryptedContent = encrypt.encrypt(contentInput.value);
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: encryptedTitle,
          content: encryptedContent,
        }),
      });
      if (response.status !== 200) {
        feed.innerHTML = `Something went wrong. Error: ${response.status}`;
        return;
      }
      titleInput.value = "";
      contentInput.value = "";
      await getPosts();
    } catch (error) {
      feed.innerHTML = error;
    }
  });
});
