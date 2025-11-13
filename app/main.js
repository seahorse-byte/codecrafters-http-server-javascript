const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

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
  console.log(":::path:::", path);

  if (path === "/") {
    return "HTTP/1.1 200 OK\r\n\r\n";
  } else if (path.startsWith("/echo/")) {
    const str = path.split("/")[2];
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`;
  } else if (path.startsWith("/user-agent")) {
    const userAgent = headers["User-Agent"] || "";
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
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
    // console.log(path);

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
