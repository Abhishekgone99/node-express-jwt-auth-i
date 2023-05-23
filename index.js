const http = require("http");
const app = require("./app");
const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;



// we are calling our app here and listening to the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
