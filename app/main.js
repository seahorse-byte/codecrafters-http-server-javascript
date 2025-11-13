const net = require("net");
const fs = require("fs");

// At the top of your main.js file
const args = process.argv.slice(2); // Get all arguments after "node" and "main.js"
const directoryFlagIndex = args.indexOf("--directory");
const directory =
  directoryFlagIndex !== -1 ? args[directoryFlagIndex + 1] : "/tmp/"; // Get the path

function parseHeaders(request) {
  const headers = {};
  const lines = request.split("\r\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const [key, value] = line.split(": ");
    headers[key] = value;
  }
  return headers;
}

function handlePath(path, headers) {
  if (path === "/") {
    return "HTTP/1.1 200 OK\r\n\r\n";
  } else if (path.startsWith("/echo/")) {
    const str = path.split("/")[2];
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`;
  } else if (path.startsWith("/user-agent")) {
    const userAgent = headers["User-Agent"] || "";
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
  } else if (path.startsWith("/files/")) {
    try {
      const filename = path.split("/")[2];
      const filePath = `${directory}${filename}`;
      const fileContent = fs.readFileSync(filePath); // No utf-8 for octet-stream

      return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`;
    } catch (error) {
      // If the file doesn't exist, return 404
      return "HTTP/1.1 404 Not Found\r\n\r\n";
    }
  } else {
    return "HTTP/1.1 404 Not Found\r\n\r\n";
  }
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    // console.log(parseHeaders(data.toString()));
    const request = data.toString();
    const headers = parseHeaders(request);
    const path = request.split(" ")[1];

    const response = handlePath(path, headers);
    console.log("response", response);
    socket.write(response);
    socket.end();
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
