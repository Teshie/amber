// This code imports the axios library and the baseURL from the apiClient file.
// It creates an instance of axios with the baseURL and an empty headers object.
// Then it sets up an interceptor for the requests made with this instance.
// The interceptor checks the local storage for a stored "meme" item,
// it then parses the data and checks if it contains a token. If it does,
// it adds an "Authorization" header to the request with the value of "Token" plus the token.
// If there is an error it returns a rejected promise with the error.
// Finally, it exports the http instance as default.

import axios from "axios";
import { baseURL } from "./apiClient";

const http = axios.create({
  baseURL: `${baseURL}/`,
  Headers: {},
});

try {
  http.interceptors.request.use(
    (config) => {
      let data = JSON.parse(localStorage.getItem("bingo"));

      if (data && data.user_status.token) {
        config.headers["Authorization"] = "Token " + data.user_status.token;
      }

      return config;
    },

    (error) => {
      return Promise.reject(error);
    }
  );
} catch (error) {
  console.log(error);
}

export default http;
