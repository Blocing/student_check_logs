const userRouter = require("../api/users/routes");
const cardRouter = require("../api/cards/routes");
const attendanceRouter = require("../api/attendances/routes");
const loadRouter = (app) => {
  app.use("/user", userRouter);
  app.use("/idcard", cardRouter);
  app.use("/attendance", attendanceRouter);
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Not Found" });
  });
};

module.exports = loadRouter;
