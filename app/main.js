// const net = require("net");
// const fs = require("fs");
// const zlib = require("zlib");

// // At the top of your main.js file
// const args = process.argv.slice(2); // Get all arguments after "node" and "main.js"
// const directoryFlagIndex = args.indexOf("--directory");
// const directory =
//   directoryFlagIndex !== -1 ? args[directoryFlagIndex + 1] : "/tmp/"; // Get the path

// function parseHeaders(request) {
//   const headers = {};
//   const lines = request.split("\r\n");
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i];
//     const [key, value] = line.split(": ");
//     headers[key] = value;
//   }
//   return headers;
// }

// function handlePath(path, headers, method, body) {
//   console.log("headers", headers);
//   console.log("method", method);
//   console.log("body", body);
//   if (path === "/") {
//     return "HTTP/1.1 200 OK\r\n\r\n";
//   } else if (path.startsWith("/echo/")) {
//     const str = path.split("/")[2];
//     const acceptEncodingHeader = headers["Accept-Encoding"] || "";
//     if (acceptEncodingHeader.includes("gzip")) {
//       const compressedBody = zlib.gzipSync(str);
//       return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressedBody.length}\r\n\r\n${compressedBody}`;
//     }
//     return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`;
//   } else if (path.startsWith("/user-agent")) {
//     const userAgent = headers["User-Agent"] || "";
//     return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
//   } else if (path.startsWith("/files/")) {
//     const filename = path.split("/")[2];
//     const filePath = `${directory}${filename}`;
//     if (method === "POST") {
//       // write the file with the post request body data passed with --data flag
//       try {
//         fs.writeFileSync(filePath, body);

//         return "HTTP/1.1 201 Created\r\n\r\n";
//       } catch (error) {
//         return "HTTP/1.1 500 Internal Server Error\r\n\r\n";
//       }
//     } else {
//       try {
//         const fileContent = fs.readFileSync(filePath); // No utf-8 for octet-stream

//         return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`;
//       } catch (error) {
//         // If the file doesn't exist, return 404
//         return "HTTP/1.1 404 Not Found\r\n\r\n";
//       }
//     }
//   } else {
//     return "HTTP/1.1 404 Not Found\r\n\r\n";
//   }
// }

// const server = net.createServer((socket) => {
//   socket.on("data", (data) => {
//     // 1. Convert the data Buffer to a string
//     const requestString = data.toString();
//     console.log("requestString", requestString);
//     const headers = parseHeaders(requestString);
//     const path = requestString.split(" ")[1];
//     const method = requestString.split(" ")[0];
//     const body = requestString.split("\r\n\r\n")[1];

//     const response = handlePath(path, headers, method, body);
//     socket.write(response);
//     socket.end();
//   });

//   socket.on("close", () => {
//     socket.end();
//   });
// });

// server.listen(4221, "localhost");
// REFACTORED CODE BELOW. now handlePath handles the socket and writes the response to it step by step.

const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

// At the top of your main.js file
const args = process.argv.slice(2); // Get all arguments after "node" and "main.js"
const directoryFlagIndex = args.indexOf("--directory");
const directory =
  directoryFlagIndex !== -1 ? args[directoryFlagIndex + 1] : "/tmp/"; // Get the path

function parseHeaders(requestString) {
  const headers = {};
  const lines = requestString.split("\r\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line) {
      const [key, value] = line.split(": ", 2); // Split only on the first ": "
      if (key && value) {
        headers[key] = value;
      }
    }
  }
  return headers;
}

// NOTE: socket is now the first argument
function handlePath(socket, path, headers, method, bodyBuffer) {
  if (path === "/") {
    socket.write("HTTP/1.1 200 OK\r\n\r\n");
    socket.end();
  } else if (path.startsWith("/echo/")) {
    const str = path.split("/")[2]; // get the string after /echo/
    const acceptEncodingHeader = headers["Accept-Encoding"] || ""; // get the accept encoding header

    if (acceptEncodingHeader.includes("gzip")) {
      const compressedBody = zlib.gzipSync(str); // compress the string

      // 2. Write text headers [Content-Type, Content-Encoding, Content-Length, End of headers]
      socket.write("HTTP/1.1 200 OK\r\n");
      socket.write("Content-Type: text/plain\r\n");
      socket.write("Content-Encoding: gzip\r\n");
      socket.write(`Content-Length: ${compressedBody.length}\r\n`);
      socket.write("\r\n"); // End of headers

      // 3. Write the binary Buffer and end socket
      socket.write(compressedBody);
      socket.end();
    } else {
      // here no compression, just send as a normal string
      socket.write("HTTP/1.1 200 OK\r\n");

      // 2. Write text headers [Content-Type, Content-Length, End of headers]
      socket.write("Content-Type: text/plain\r\n");
      socket.write(`Content-Length: ${str.length}\r\n`);
      socket.write("\r\n"); // End of headers

      // 3. Write the string and end socket
      socket.write(str);
      socket.end();
    }
  } else if (path.startsWith("/user-agent")) {
    const userAgent = headers["User-Agent"] || "";
    socket.write("HTTP/1.1 200 OK\r\n");

    // 2. Write text headers [Content-Type, Content-Length, End of headers]
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${userAgent.length}\r\n`);
    socket.write("\r\n"); // End of headers

    // 3. Write the string and end socket
    socket.write(userAgent);
    socket.end();
  } else if (path.startsWith("/files/")) {
    const filename = path.split("/")[2];
    const filePath = `${directory}${filename}`;

    if (method === "POST") {
      try {
        // bodyBuffer is now a raw, uncorrupted Buffer
        fs.writeFileSync(filePath, bodyBuffer);
        socket.write("HTTP/1.1 201 Created\r\n\r\n");
        socket.end();
      } catch (error) {
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.end();
      }
    } else {
      // GET method
      try {
        // 1. Read the file as a Buffer
        const fileContent = fs.readFileSync(filePath);

        // 2. Write headers [Content-Type, Content-Length, End of headers]
        socket.write("HTTP/1.1 200 OK\r\n");
        socket.write("Content-Type: application/octet-stream\r\n");
        socket.write(`Content-Length: ${fileContent.length}\r\n`);
        socket.write("\r\n"); // End of headers

        // 3. Write the binary Buffer and end socket
        socket.write(fileContent);
        socket.end();
      } catch (error) {
        // If file doesn't exist or error reading file
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
      }
    }
  } else {
    // If path doesn't match any of the above

    // 1. Write headers [Content-Type, Content-Length, End of headers]
    socket.write("HTTP/1.1 404 Not Found\r\n");
    socket.write("Content-Type: text/plain\r\n");
    socket.write("Content-Length: 0\r\n");
    socket.write("\r\n"); // End of headers

    // 2. End socket
    socket.end();
  }
}

const server = net.createServer((socket) => {
  // We need to buffer data in case it comes in chunks, but for this
  // challenge, we'll assume the entire request is in the first `data` event.
  socket.on("data", (data) => {
    // Find the end of headers
    const headerEndIndex = data.indexOf("\r\n\r\n");

    // Extract headers as a string
    const requestHeaderString = data.subarray(0, headerEndIndex).toString();

    // Extract body as a raw Buffer
    const bodyBuffer = data.subarray(headerEndIndex + 4);

    // Parse the header string
    const headers = parseHeaders(requestHeaderString);
    const requestLine = requestHeaderString.split("\r\n")[0];
    const path = requestLine.split(" ")[1];
    const method = requestLine.split(" ")[0];

    // Pass the socket and the raw bodyBuffer to handlePath - let handlePath write the response
    handlePath(socket, path, headers, method, bodyBuffer);
  });

  socket.on("close", () => {
    socket.end();
  });

  socket.on("error", (err) => {
    console.error(err);
    socket.end();
  });
});

server.listen(4221, "localhost");
