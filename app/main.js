const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const path = request.split(" ")[1];
    console.log(path);

    if (path === "/") {
      const response = "HTTP/1.1 200 OK\r\n\r\n";
      socket.write(response);
    } else {
      //    handle /echo/{str} where the body is the string str - res 200 with Content-Type and Content-Length header.
      if (path.startsWith("/echo")) {
        const str = path.split("/")[2];
        const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`;
        socket.write(response);
      } else {
        const response = "HTTP/1.1 404 Not Found\r\n\r\n";
        socket.write(response);
      }
    }

    socket.end();
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
