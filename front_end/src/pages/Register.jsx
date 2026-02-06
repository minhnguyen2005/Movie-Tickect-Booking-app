import React from "react";
import Login from "./Login";

// Dùng chung layout login/register, chỉ đặt mặc định ở tab "register"
const Register = () => {
  return <Login initialMode="register" />;
};

export default Register;
