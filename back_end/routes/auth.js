const router = require("express").Router();
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  try {
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist)
      return res.status(400).json({ message: "Email này đã được đăng ký!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email không tồn tại trong hệ thống!" });

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass)
      return res.status(400).json({ message: "Mật khẩu không chính xác!" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res.header("auth-token", token).json({
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      message: "Đăng nhập thành công",
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
});

module.exports = router;
