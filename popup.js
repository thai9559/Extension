document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("startCrawl");
  const stopButton = document.getElementById("stopCrawl");
  const exportButton = document.getElementById("exportData");
  const clearButton = document.getElementById("clearData");
  const statusDiv = document.getElementById("status");
  const progressDiv = document.getElementById("progress");
  const crawledCountSpan = document.getElementById("crawledCount");
  const autoClickStatusSpan = document.getElementById("autoClickStatus");
  const autoScrollStatusSpan = document.getElementById("autoScrollStatus");
  const currentItemSpan = document.getElementById("currentItem");
  const totalItemsSpan = document.getElementById("totalItems");
  const resumeButton = document.getElementById("resumeCrawl");
  const searchButton = document.getElementById("searchButton");
  const searchKeywordInput = document.getElementById("searchKeyword");

  searchButton.addEventListener("click", function () {
    const keyword = searchKeywordInput.value.trim();
    if (!keyword) {
      showStatus("Vui lòng nhập từ khóa tìm kiếm!", "error");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "searchKeyword", keyword: keyword },
        function (response) {
          if (chrome.runtime.lastError) {
            showStatus(
              "Không thể gửi lệnh tìm kiếm. Hãy mở lại Google Maps.",
              "error"
            );
            return;
          }
          if (response && response.success) {
            showStatus("Đã gửi từ khóa tìm kiếm, đợi crawl...", "success");
          } else {
            showStatus("Tìm kiếm thất bại.", "error");
          }
        }
      );
    });
  });

  // Kiểm tra xem có đang ở trang Google Maps không
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (currentTab.url.includes("google.com/maps")) {
      showStatus("Đang ở trang Google Maps", "success");
    } else {
      showStatus("Vui lòng mở Google Maps để sử dụng extension", "error");
      startButton.disabled = true;
    }
  });

  // Bắt đầu crawl
  startButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "startCrawl" },
        function (response) {
          if (response && response.success) {
            showStatus("Đã bắt đầu crawl dữ liệu", "success");
            startButton.disabled = true;
            stopButton.disabled = false;
            progressDiv.style.display = "block";
          } else {
            showStatus("Không thể bắt đầu crawl. Vui lòng thử lại.", "error");
          }
        }
      );
    });
  });

  // Dừng crawl
  stopButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "stopCrawl" },
        function (response) {
          if (response && response.success) {
            showStatus("Đã dừng crawl dữ liệu", "info");
            startButton.disabled = false;
            stopButton.disabled = true;
          } else {
            showStatus("Không thể dừng crawl. Vui lòng thử lại.", "error");
          }
        }
      );
    });
  });

  // Xuất dữ liệu
  // exportButton.addEventListener("click", function () {
  //   chrome.storage.local.get(["crawledData"], function (result) {
  //     if (result.crawledData && result.crawledData.length > 0) {
  //       try {
  //         const dataStr = JSON.stringify(result.crawledData, null, 2);
  //         const dataBlob = new Blob([dataStr], { type: "application/json" });
  //         const url = URL.createObjectURL(dataBlob);

  //         chrome.downloads.download(
  //           {
  //             url: url,
  //             filename: "google_maps_data.json",
  //             saveAs: true,
  //           },
  //           function (downloadId) {
  //             if (chrome.runtime.lastError) {
  //               console.error("Lỗi download:", chrome.runtime.lastError);
  //               showStatus(
  //                 "Lỗi khi xuất dữ liệu: " + chrome.runtime.lastError.message,
  //                 "error"
  //               );
  //             } else {
  //               showStatus("Đã xuất dữ liệu thành công", "success");
  //             }
  //           }
  //         );
  //       } catch (error) {
  //         console.error("Lỗi khi tạo file:", error);
  //         showStatus("Lỗi khi tạo file dữ liệu", "error");
  //       }
  //     } else {
  //       showStatus("Không có dữ liệu để xuất", "error");
  //     }
  //   });
  // });
  exportButton.addEventListener("click", function () {
    chrome.storage.local.get(["crawledData"], function (result) {
      const raw = result.crawledData || [];

      if (raw.length === 0) {
        showStatus("Không có dữ liệu để xuất", "error");
        return;
      }

      // Hàm tách địa chỉ thành các phần
      function parseAddress(address) {
        if (!address) return {};
        address = address
          .replace(/,\s*Việt Nam/i, "")
          .replace(/\d{5,6}/g, "")
          .trim();
        const parts = address.split(",").map((p) => p.trim());
        const partLen = parts.length;

        let street = "",
          ward = "",
          district = "",
          city = "";
        if (partLen >= 4) {
          city = parts[partLen - 1];
          district = parts[partLen - 2];
          ward = parts[partLen - 3];
          street = parts.slice(0, partLen - 3).join(", ");
        } else if (partLen === 3) {
          city = parts[2];
          district = parts[1];
          street = parts[0];
        } else {
          street = address;
        }

        return {
          street,
          ward,
          district,
          city,
        };
      }

      // 🧹 1. Làm sạch và định dạng lại dữ liệu
      const cleanedData = raw.map((item, index) => {
        const cleanText = (text) =>
          typeof text === "string"
            ? text.replace(/^[^\w\d\s]+/g, "").trim()
            : "";

        // Format số điện thoại
        let phone = item.phone || "";
        if (phone.startsWith("+84")) {
          phone = "0" + phone.slice(3);
        } else if (phone.startsWith("84")) {
          phone = "0" + phone.slice(2);
        }

        // Format ngày
        let date = "";
        try {
          date = new Date(item.timestamp).toLocaleDateString("vi-VN");
        } catch {}

        // Tách địa chỉ
        const { street, ward, district, city } = parseAddress(
          item.address || ""
        );

        return {
          STT: index + 1,
          NAME: cleanText(item.name),
          STREET: cleanText(street),
          WARD: cleanText(ward),
          DISTRICT: cleanText(district),
          CITY: cleanText(city),
          CATEGORY: item.category || "",
          DESCRIPTION: item.description || "",
          FACEBOOK: item.facebook || "",
          WEBSITE: item.website || "",
          PHONE: phone,
          OPENING_HOURS: item.openingHours || "",
          RATING: item.rating || "",
          REVIEWS: item.reviews || "",
          TIMESTAMP: date,
        };
      });

      // 🧾 2. Tạo worksheet từ JSON
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);

      // 🎨 3. Style tiêu đề
      const headers = Object.keys(cleanedData[0]);
      headers.forEach((key, colIdx) => {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
        if (!worksheet[cellAddr]) return;
        worksheet[cellAddr].s = {
          font: { name: "Arial", sz: 16, bold: true },
          alignment: { horizontal: "center", vertical: "center" },
        };
      });

      // 💅 4. Style dữ liệu
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[addr]) {
            worksheet[addr].s = {
              font: { name: "Arial", sz: 16 },
              alignment: { vertical: "center" },
            };
          }
        }
      }

      // 📏 5. Set độ rộng cột
      worksheet["!cols"] = headers.map(() => ({ wch: 25 }));

      // 📚 6. Tạo file Excel
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Google Maps Data");

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download(
        {
          url: url,
          filename: "google_maps_data.xlsx",
          saveAs: true,
        },
        function (downloadId) {
          if (chrome.runtime.lastError) {
            console.error("Lỗi download:", chrome.runtime.lastError);
            showStatus(
              "Lỗi khi xuất dữ liệu: " + chrome.runtime.lastError.message,
              "error"
            );
          } else {
            showStatus("✅ Đã xuất Excel có định dạng chuẩn", "success");
          }
        }
      );
    });
  });

  // Xóa dữ liệu
  clearButton.addEventListener("click", function () {
    if (confirm("Bạn có chắc muốn xóa tất cả dữ liệu đã crawl?")) {
      chrome.storage.local.set({ crawledData: [] }, function () {
        showStatus("Đã xóa tất cả dữ liệu", "success");
        updateCrawledCount();
      });
    }
  });

  // Khi mở popup, kiểm tra trạng thái resumeNeeded
  chrome.storage.local.get(["resumeNeeded"], function (result) {
    if (result.resumeNeeded) {
      resumeButton.style.display = "block";
      showStatus(
        "Extension bị reload hoặc trang bị làm mới. Bấm 'Tiếp tục Crawl' để tiếp tục.",
        "error"
      );
      startButton.disabled = true;
      stopButton.disabled = true;
    }
  });

  // Thêm sự kiện cho nút Tiếp tục Crawl
  resumeButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "resumeCrawl" },
        function (response) {
          if (chrome.runtime.lastError) {
            showStatus(
              "Không thể kết nối tới trang Google Maps. Vui lòng reload lại trang rồi bấm 'Tiếp tục Crawl'!",
              "error"
            );
            return;
          }
          if (response && response.success) {
            showStatus("Đã tiếp tục crawl dữ liệu", "success");
            resumeButton.style.display = "none";
            startButton.disabled = true;
            stopButton.disabled = false;
            progressDiv.style.display = "block";
            chrome.storage.local.set({ resumeNeeded: false });
          } else {
            showStatus("Không thể tiếp tục crawl. Vui lòng thử lại.", "error");
          }
        }
      );
    });
  });

  // Cập nhật số lượng đã crawl
  function updateCrawledCount() {
    chrome.storage.local.get(["crawledData"], function (result) {
      const count = result.crawledData ? result.crawledData.length : 0;
      crawledCountSpan.textContent = count;
    });
  }

  // Cập nhật thông tin auto click và scroll
  function updateAutoClickInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getAutoClickInfo" },
        function (response) {
          if (response && response.success) {
            autoClickStatusSpan.textContent = response.isAutoClicking
              ? "Đang chạy..."
              : "Đã dừng";
            autoScrollStatusSpan.textContent = response.isAutoScrolling
              ? "Đang chạy..."
              : "Đã dừng";
            currentItemSpan.textContent = response.currentIndex || 0;
            totalItemsSpan.textContent = response.totalItems || 0;
          }
        }
      );
    });
  }

  // Hiển thị status
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }

  // Lắng nghe thông báo từ content script
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "updateCount") {
      updateCrawledCount();
    }
    // Nếu nhận được thông báo context invalidated, hiện nút tiếp tục crawl
    if (request.action === "showResumeCrawl") {
      resumeButton.style.display = "block";
      showStatus(
        "Extension bị reload hoặc trang bị làm mới. Bấm 'Tiếp tục Crawl' để tiếp tục.",
        "error"
      );
      startButton.disabled = true;
      stopButton.disabled = true;
    }
  });

  // Cập nhật count ban đầu
  updateCrawledCount();

  // Cập nhật thông tin auto click định kỳ
  setInterval(updateAutoClickInfo, 2000);
  updateAutoClickInfo();
});
