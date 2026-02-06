import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/EditProfile.css";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import { FaCamera, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaVenusMars } from "react-icons/fa";

const EditProfile = () => {
  const { user: contextUser, setUser: setContextUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    avatar: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(API_ENDPOINTS.AUTH.GET_CURRENT_USER, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          throw new Error("Không thể tải thông tin người dùng");
        }

        const data = await response.json();
        if (data.success && data.data.user) {
          const user = data.data.user;
          setFormData({
            fullName: user.fullName || "",
            phone: user.phone || "",
            gender: user.gender || "",
            avatar: user.avatar || "",
          });
          setAvatarPreview(user.avatar || "");
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    if (contextUser) {
      setFormData({
        fullName: contextUser.fullName || "",
        phone: contextUser.phone || "",
        gender: contextUser.gender || "",
        avatar: contextUser.avatar || "",
      });
      setAvatarPreview(contextUser.avatar || "");
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, [contextUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Kiểm tra định dạng file
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh");
        return;
      }

      // Đọc file và chuyển thành base64 hoặc URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setAvatarPreview(result);
        setFormData((prev) => ({
          ...prev,
          avatar: result, // Lưu base64 hoặc URL
        }));
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cập nhật thất bại");
      }

      if (data.success) {
        // Cập nhật context user
        if (setContextUser) {
          setContextUser(data.data.user);
        }
        // Quay lại trang profile
        navigate("/profile", { state: { message: "Cập nhật thông tin thành công!" } });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      setError(error.message || "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <div className="edit-profile-header">
          <button className="btn-back" onClick={() => navigate("/profile")}>
            <FaArrowLeft /> Quay lại
          </button>
          <h1>Chỉnh sửa hồ sơ</h1>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {error && <div className="error-message">{error}</div>}

          {/* Avatar Section */}
          <div className="form-section">
            <label className="section-label">Ảnh đại diện</label>
            <div className="avatar-upload-section">
              <div className="avatar-preview-container">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      {formData.fullName
                        ? formData.fullName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className="avatar-upload-label">
                  <FaCamera />
                  <span>Chọn ảnh</span>
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-upload-input"
                />
              </div>
              <p className="avatar-hint">Kích thước tối đa 5MB. Định dạng: JPG, PNG, GIF</p>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-section">
            <label htmlFor="fullName" className="form-label">
              <FaUser /> Họ và tên
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          {/* Email (read-only) */}
          <div className="form-section">
            <label htmlFor="email" className="form-label">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              value={contextUser?.email || ""}
              className="form-input"
              disabled
            />
            <p className="form-hint">Email không thể thay đổi</p>
          </div>

          {/* Phone */}
          <div className="form-section">
            <label htmlFor="phone" className="form-label">
              <FaPhone /> Số điện thoại
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Gender */}
          <div className="form-section">
            <label htmlFor="gender" className="form-label">
              <FaVenusMars /> Giới tính
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/profile")}
              disabled={saving}
            >
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

