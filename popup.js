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
  exportButton.addEventListener("click", function () {
    chrome.storage.local.get(["crawledData"], function (result) {
      if (result.crawledData && result.crawledData.length > 0) {
        try {
          const dataStr = JSON.stringify(result.crawledData, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);

          chrome.downloads.download(
            {
              url: url,
              filename: "google_maps_data.json",
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
                showStatus("Đã xuất dữ liệu thành công", "success");
              }
            }
          );
        } catch (error) {
          console.error("Lỗi khi tạo file:", error);
          showStatus("Lỗi khi tạo file dữ liệu", "error");
        }
      } else {
        showStatus("Không có dữ liệu để xuất", "error");
      }
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
