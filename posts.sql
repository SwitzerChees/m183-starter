CREATE TABLE "posts" (
	"id"	INTEGER NOT NULL,
	"title"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

INSERT INTO posts (title, content) VALUES ("Introduction to JavaScript", "JavaScript is a dynamic language primarily used for web development...");