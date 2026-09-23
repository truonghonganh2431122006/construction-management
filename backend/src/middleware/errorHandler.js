function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON không hợp lệ" });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "Dữ liệu gửi lên quá lớn" });
    }
    return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại" });
}

module.exports = errorHandler;
