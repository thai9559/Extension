// Background script cho Google Maps Crawler

// Lắng nghe khi extension được cài đặt
chrome.runtime.onInstalled.addListener(function () {
  console.log("Google Maps Crawler đã được cài đặt");

  // Khởi tạo storage
  chrome.storage.local.set({
    crawledData: [],
    settings: {
      autoCrawl: false,
      crawlInterval: 2000,
    },
  });
});

// Lắng nghe message từ content script và popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateCount") {
    // Cập nhật badge với số lượng đã crawl
    chrome.storage.local.get(["crawledData"], function (result) {
      const count = result.crawledData ? result.crawledData.length : 0;
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#4285f4" });
    });
  }

  sendResponse({ success: true });
});

// Xử lý khi click vào icon extension
chrome.action.onClicked.addListener(function (tab) {
  // Mở popup khi click vào icon
  chrome.action.setPopup({ popup: "popup.html" });
});

// Lắng nghe thay đổi tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("google.com/maps")
  ) {
    // Cập nhật icon khi vào trang Google Maps
    chrome.action.setIcon({
      path: {
        16: "icons/logo.jpg",
        48: "icons/logo.jpg",
        128: "icons/logo.jpg",
      },
    });
  }
});
