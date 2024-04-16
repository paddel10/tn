const logger = {
  info: (message) => {
    console.log(message);
  },
  error: (message) => {
    console.error(message);
  },
  debug: (message) => {
    console.debug(message);
  }
};

export default logger;
