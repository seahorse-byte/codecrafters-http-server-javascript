const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
// In this stage, your server will respond to an HTTP request with a 200 response.

socket.on("data", (data) => {
    const request = data.toString();
    const response = "HTTP/1.1 200 OK\r\n\r\n";
    socket.write(response);
});





  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
