module.exports = {
  filter(data) {
    return !!data.req;
  },
  output: {
    path: "logfile.log",
    options: {
      path: "logs/",
      size: "1M",
      rotate: 5,
    },
  },
};
