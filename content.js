// Biến để theo dõi trạng thái crawl
let isCrawling = false;
let crawlInterval = null;
let autoClickInterval = null;
let autoScrollInterval = null;
let currentItemIndex = 0;
let searchResults = [];
let isAutoClicking = false;
let isAutoScrolling = false;
let scrollAttempts = 0;
let errorCount = 0;
const MAX_SCROLL_ATTEMPTS = 10;
const MAX_ERROR_COUNT = 5;

function waitForDetailPanel(callback, retry = 0) {
  const panel =
    document.querySelector(".Qo7lzb") ||
    document.querySelector(".lMbq3e") ||
    document.querySelector(".x3AX1-LfntMc-header-title");

  if (panel && panel.clientHeight > 50) {
    callback();
  } else if (retry < 10) {
    setTimeout(() => waitForDetailPanel(callback, retry + 1), 500);
  } else {
    console.warn("⏳ Panel chưa load sau nhiều lần thử → bỏ qua crawl");
    callback(); // fallback để không block
  }
}

// Bắt đầu auto scroll
function startAutoScroll() {
  if (isAutoScrolling) return;

  isAutoScrolling = true;
  scrollAttempts = 0;
  console.log("Bắt đầu auto scroll (sẽ scroll khi cần thiết)...");
}

// Dừng auto scroll
function stopAutoScroll() {
  if (!isAutoScrolling) return;

  isAutoScrolling = false;
  console.log("Dừng auto scroll...");
}

// Tự động scroll xuống
function autoScroll() {
  try {
    console.log("=== AUTO SCROLL DEBUG ===");
    // Danh sách selector có thể chứa sidebar
    const sidebarSelectors = [
      ".m6QErb",
      ".DxyBCb",
      '[role="main"]',
      "[data-js-log-root]",
      ".m6QErb.DxyBCb",
      ".m6QErb .DxyBCb",
      ".m6QErb > div",
      ".DxyBCb > div",
      '[role="main"] > div',
      '.m6QErb[role="main"]',
      '.DxyBCb[role="main"]',
    ];
    let sidebar = null;
    let foundSelector = null;
    for (let selector of sidebarSelectors) {
      const el = document.querySelector(selector);
      if (el && el.scrollHeight > el.clientHeight + 20) {
        sidebar = el;
        foundSelector = selector;
        break;
      }
    }
    // Nếu không tìm thấy, fallback: tìm element có scroll lớn nhất
    if (!sidebar) {
      let maxScroll = 0;
      document.querySelectorAll("*").forEach((el) => {
        if (el.scrollHeight - el.clientHeight > maxScroll) {
          maxScroll = el.scrollHeight - el.clientHeight;
          sidebar = el;
        }
      });
      if (sidebar) {
        console.log("Fallback sidebar:", sidebar);
      }
    }
    if (sidebar) {
      console.log("Sidebar được chọn:", foundSelector, sidebar);
      console.log(
        `Sidebar scrollHeight: ${sidebar.scrollHeight}, clientHeight: ${sidebar.clientHeight}`
      );
      // Thử nhiều cách scroll
      sidebar.scrollTop = sidebar.scrollHeight;
      sidebar.scrollTo &&
        sidebar.scrollTo({ top: sidebar.scrollHeight, behavior: "smooth" });
      sidebar.scrollBy && sidebar.scrollBy({ top: 500, behavior: "smooth" });
      setTimeout(() => {
        // Nếu vẫn không scroll, thử click nút "Xem thêm"
        const moreBtn = Array.from(
          document.querySelectorAll("button, span")
        ).find(
          (el) =>
            el.textContent.includes("Xem thêm") ||
            el.textContent.includes("More")
        );
        if (moreBtn) {
          moreBtn.click();
          console.log("Đã click nút Xem thêm");
        } else {
          console.log("Không tìm thấy nút Xem thêm");
        }
      }, 1000);
      console.log("Đã scroll sidebar:", sidebar);
    } else {
      console.warn("Không tìm thấy sidebar để scroll!");
    }
  } catch (e) {
    console.error("Lỗi khi auto scroll:", e);
  }
}

// Bắt đầu crawl
function startCrawling() {
  try {
    if (isCrawling) {
      console.log("Đã đang crawl, không bắt đầu lại");
      return;
    }

    isCrawling = true;
    errorCount = 0; // Reset error count
    console.log("Bắt đầu crawl dữ liệu Google Maps...");
    logDebugInfo();

    // Xóa dữ liệu cũ khi bắt đầu crawl mới
    clearOldData();

    // Bắt đầu crawl với interval

    // Bắt đầu auto click
    startAutoClick();

    // Bắt đầu auto scroll
    startAutoScroll();

    // Crawl ngay lập tức
    crawlData();
  } catch (error) {
    console.error("Lỗi khi bắt đầu crawl:", error);
    isCrawling = false;
    errorCount++;

    if (errorCount >= MAX_ERROR_COUNT) {
      console.error("Quá nhiều lỗi, dừng crawl");
      stopCrawling();
    }
  }
}

// Dừng crawl
function stopCrawling() {
  try {
    if (!isCrawling) {
      console.log("Crawl đã dừng rồi");
      return;
    }

    isCrawling = false;
    console.log("Dừng crawl dữ liệu...");
    logDebugInfo();

    if (crawlInterval) {
      clearInterval(crawlInterval);
      crawlInterval = null;
    }

    // Dừng auto click
    stopAutoClick();

    // Dừng auto scroll
    stopAutoScroll();

    // Reset error count
    errorCount = 0;
  } catch (error) {
    console.error("Lỗi khi dừng crawl:", error);
    // Force reset trạng thái
    isCrawling = false;
    isAutoClicking = false;
    isAutoScrolling = false;
    errorCount = 0;
  }
}

// Hàm crawl dữ liệu chính
function crawlData() {
  try {
    if (!isCrawling) return;

    const placeData = extractPlaceData();

    if (placeData && placeData.name) {
      // DEBUG: kiểm tra DOM thật sự có bao nhiêu link FB
      const fbLinks = document.querySelectorAll('a[href*="facebook.com"]');
      console.log(`📘 Có ${fbLinks.length} link FB trong DOM`);

      // Nếu không tìm thấy FB, chờ thêm rồi thử lại 1 lần duy nhất
      if (!placeData.facebook && fbLinks.length > 0) {
        placeData.facebook = fbLinks[0].href;
        console.log(
          "⚠️ Facebook chưa load đúng, dùng link đầu tiên:",
          placeData.facebook
        );
      }

      savePlaceData(placeData);
      chrome.runtime.sendMessage({ action: "updateCount" });
      console.log("✅ Đã crawl:", placeData.name);
    } else {
      console.warn("❌ Không extract được dữ liệu từ panel chi tiết");
    }
  } catch (error) {
    console.error("❌ Lỗi khi crawl dữ liệu:", error);
    errorCount++;
    if (errorCount >= MAX_ERROR_COUNT) {
      console.error("🚫 Quá nhiều lỗi, dừng crawl");
      stopCrawling();
    }
  }
}

// Trích xuất dữ liệu địa điểm hiện tại
function extractPlaceData() {
  const placeData = {
    name: "",
    address: "",
    phone: "",
    website: "",
    facebook: "",
    category: "",
    coordinates: "",
    description: "",
    mapsUrl: "",
    timestamp: new Date().toISOString(),
  };

  try {
    // Tìm tên địa điểm
    const nameSelectors = [
      'h1[data-attrid="title"]',
      "h1.DUwDvf",
      'h1[role="main"]',
      ".DUwDvf",
      '[data-attrid="title"]',
    ];

    for (let selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.name = element.textContent.trim();
        break;
      }
    }

    // Tìm địa chỉ
    const addressSelectors = [
      '[data-item-id="address"]',
      '[data-attrid="address"]',
      'button[data-item-id="address"]',
      ".rogA2c",
    ];

    for (let selector of addressSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.address = element.textContent.trim();
        break;
      }
    }

    // Tìm số điện thoại
    const phoneSelectors = [
      '[data-item-id="phone:tel:"]',
      '[data-attrid="phone:tel:"]',
      'button[data-item-id="phone:tel:"]',
      'a[href^="tel:"]',
      'a[href*="tel:"]',
      '[aria-label*="phone"]',
      '[aria-label*="điện thoại"]',
      '.rogA2c[aria-label*="phone"]',
      '.rogA2c[aria-label*="điện thoại"]',
      'button[aria-label*="phone"]',
      'button[aria-label*="điện thoại"]',
    ];

    for (let selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        let phoneText =
          element.textContent.trim() ||
          element.href ||
          element.getAttribute("aria-label") ||
          "";

        // Lọc số điện thoại từ text
        if (phoneText) {
          // Tìm số điện thoại Việt Nam
          const phoneRegex = /(\+84|84|0)[0-9\s\-\.\(\)]{9,15}/g;
          const matches = phoneText.match(phoneRegex);
          if (matches && matches.length > 0) {
            placeData.phone = matches[0].replace(/[\s\-\.\(\)]/g, "");
            break;
          }
        }
      }
    }

    // Tìm số điện thoại trong toàn bộ trang nếu chưa tìm thấy
    if (!placeData.phone) {
      const allElements = document.querySelectorAll("*");
      for (let element of allElements) {
        const text =
          element.textContent || element.getAttribute("aria-label") || "";
        if (text) {
          const phoneRegex = /(\+84|84|0)[0-9\s\-\.\(\)]{9,15}/g;
          const matches = text.match(phoneRegex);
          if (matches && matches.length > 0) {
            placeData.phone = matches[0].replace(/[\s\-\.\(\)]/g, "");
            console.log("Tìm thấy số điện thoại:", placeData.phone);
            break;
          }
        }
      }
    }

    // Tìm website
    const websiteSelectors = [
      '[data-item-id="authority"]',
      '[data-attrid="authority"]',
      'a[data-item-id="authority"]',
    ];

    for (let selector of websiteSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.website = element.href || element.textContent.trim();
        break;
      }
    }

    // Tìm Facebook
    const facebookSelectors = [
      'a[href*="facebook.com"]',
      'a[href*="fb.com"]',
      '[data-item-id*="facebook"]',
      'a[aria-label*="Facebook"]',
    ];

    for (let selector of facebookSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.facebook = element.href || element.textContent.trim();
        break;
      }
    }

    // Tìm category
    const categorySelectors = [".DkEaL", '[data-attrid="category"]'];

    for (let selector of categorySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.category = element.textContent.trim();
        break;
      }
    }

    // Tìm mô tả
    const descriptionSelectors = [
      '.rogA2c[aria-label*="mô tả"]',
      '.rogA2c[aria-label*="description"]',
    ];

    for (let selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        placeData.description = element.textContent.trim();
        break;
      }
    }

    // Nếu chưa tìm thấy, tìm kiếm các element .rogA2c có chứa text liên quan đến mô tả
    if (!placeData.description) {
      const rogElements = document.querySelectorAll(".rogA2c");
      for (let element of rogElements) {
        const text = element.textContent.trim();
        if (
          text.includes("Dịch vụ") ||
          text.includes("Chuyên") ||
          text.toLowerCase().includes("mô tả") ||
          text.toLowerCase().includes("description")
        ) {
          placeData.description = text;
          console.log("Tìm thấy mô tả:", text);
          break;
        }
      }
    }

    placeData.mapsUrl = window.location.href;

    // Lấy coordinates từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const coords = urlParams.get("q");
    if (coords) {
      placeData.coordinates = coords;
    }
  } catch (error) {
    console.error("Lỗi khi trích xuất dữ liệu địa điểm:", error);
  }

  return placeData;
}

// Kiểm tra xem có cần scroll thêm không
function shouldScrollMore() {
  // Scroll khi còn 2 item cuối cùng trong danh sách
  if (searchResults.length === 0) return false;
  const nearEnd = currentItemIndex >= searchResults.length - 2;
  if (nearEnd) {
    console.log(
      `Đã đến gần cuối danh sách (item ${currentItemIndex + 1}/$${
        searchResults.length
      }), sẽ scroll để load thêm.`
    );
    return true;
  }
  return false;
}

// Tìm element có scrollbar
function findScrollableElement() {
  // Tìm tất cả elements có thể scroll
  const allElements = document.querySelectorAll("*");
  const scrollableElements = [];

  for (let element of allElements) {
    try {
      const style = window.getComputedStyle(element);
      const overflow = style.overflow + style.overflowY;

      // Kiểm tra xem element có scrollbar không
      if (overflow.includes("scroll") || overflow.includes("auto")) {
        if (element.scrollHeight > element.clientHeight) {
          scrollableElements.push({
            element: element,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            className: element.className,
            id: element.id,
          });
        }
      }
    } catch (error) {
      // Bỏ qua lỗi
    }
  }

  // Sắp xếp theo kích thước scroll
  scrollableElements.sort((a, b) => b.scrollHeight - a.scrollHeight);

  console.log("Tìm thấy", scrollableElements.length, "elements có thể scroll:");
  scrollableElements.forEach((item, index) => {
    console.log(
      `${index + 1}. Class: ${item.className}, ID: ${item.id}, Scroll: ${
        item.scrollHeight
      }, Client: ${item.clientHeight}`
    );
  });

  return scrollableElements.length > 0 ? scrollableElements[0].element : null;
}

// Kiểm tra trạng thái và log debug info
function logDebugInfo() {
  console.log("=== DEBUG INFO ===");
  console.log("isCrawling:", isCrawling);
  console.log("isAutoClicking:", isAutoClicking);
  console.log("isAutoScrolling:", isAutoScrolling);
  console.log("currentItemIndex:", currentItemIndex);
  console.log("searchResults.length:", searchResults.length);
  console.log("errorCount:", errorCount);
  console.log("scrollAttempts:", scrollAttempts);
  console.log("crawlInterval:", !!crawlInterval);
  console.log("autoClickInterval:", !!autoClickInterval);
  console.log("autoScrollInterval:", !!autoScrollInterval);
  console.log("==================");
}

// Bắt đầu auto click
function startAutoClick() {
  if (isAutoClicking) return;

  isAutoClicking = true;
  currentItemIndex = 0;
  console.log("Bắt đầu auto click...");

  // Tìm danh sách kết quả tìm kiếm
  findSearchResults();

  // Bắt đầu click với delay
  function scheduleNextClick(delay = 5000) {
    if (!isAutoClicking) return;
    setTimeout(() => {
      autoClickNext();
      scheduleNextClick(); // gọi tiếp vòng sau
    }, delay);
  }
  scheduleNextClick(); // khởi động lần đầu
}

// Dừng auto click
function stopAutoClick() {
  if (!isAutoClicking) return;

  isAutoClicking = false;
  console.log("Dừng auto click...");

  if (autoClickInterval) {
    clearInterval(autoClickInterval);
    autoClickInterval = null;
  }
}

// Tìm danh sách kết quả tìm kiếm
function findSearchResults() {
  const resultSelectors = [
    '[role="article"]',
    ".hfpxzc",
    ".Nv2PK",
    "[data-result-index]",
    ".Nv2PK.tH5CWc",
  ];

  for (let selector of resultSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      searchResults = Array.from(elements);
      console.log("Tìm thấy", searchResults.length, "kết quả tìm kiếm");
      break;
    }
  }
}

// Tự động click vào item tiếp theo
function autoClickNext() {
  if (!isAutoClicking) return;

  findSearchResults();
  if (currentItemIndex >= searchResults.length) {
    console.log("Hết danh sách, dừng auto click");
    stopAutoClick();
    return;
  }

  const currentItem = searchResults[currentItemIndex];
  if (!currentItem) {
    console.warn("⚠️ Item không tồn tại trong DOM, bỏ qua...");
    return;
  }

  console.log(`🖱 Click item ${currentItemIndex + 1}/${searchResults.length}`);
  currentItem.scrollIntoView({ behavior: "smooth", block: "center" });
  currentItem.click();

  waitForDetailPanel(() => {
    crawlData(); // chỉ crawl khi panel chắc chắn có
    currentItemIndex++; // tăng index sau khi crawl xong

    if (shouldScrollMore()) {
      setTimeout(() => {
        autoScroll();
        setTimeout(() => {
          findSearchResults(); // cập nhật lại list
        }, 1000);
      }, 1000);
    }
  });
}

// Trích xuất danh sách kết quả tìm kiếm
function extractSearchResults() {
  const results = [];

  try {
    // Tìm các element chứa kết quả tìm kiếm
    const resultSelectors = [
      '[role="article"]',
      ".hfpxzc",
      ".Nv2PK",
      "[data-result-index]",
    ];

    for (let selector of resultSelectors) {
      const elements = document.querySelectorAll(selector);

      if (elements.length > 0) {
        elements.forEach((element, index) => {
          if (index < 10) {
            // Giới hạn 10 kết quả đầu
            const placeData = {
              name: "",
              address: "",
              rating: "",
              reviews: "",
              category: "",
              timestamp: new Date().toISOString(),
            };

            // Tìm tên
            const nameElement = element.querySelector(
              "h3, .qBF1Pd, .fontHeadlineSmall"
            );
            if (nameElement) {
              placeData.name = nameElement.textContent.trim();
            }

            // Tìm địa chỉ
            const addressElement = element.querySelector(
              '[data-attrid="address"], .W4Efsd'
            );
            if (addressElement) {
              placeData.address = addressElement.textContent.trim();
            }

            // Tìm rating
            const ratingElement = element.querySelector(".MW4etd, .lAiUod");
            if (ratingElement) {
              placeData.rating = ratingElement.textContent.trim();
            }

            // Tìm reviews
            const reviewsElement = element.querySelector(".UYQny");
            if (reviewsElement) {
              placeData.reviews = reviewsElement.textContent.trim();
            }

            // Tìm category
            const categoryElement = element.querySelector(".W4Efsd .W4Efsd");
            if (categoryElement) {
              placeData.category = categoryElement.textContent.trim();
            }

            if (placeData.name) {
              results.push(placeData);
            }
          }
        });

        break; // Chỉ xử lý selector đầu tiên có kết quả
      }
    }
  } catch (error) {
    console.error("Lỗi khi trích xuất kết quả tìm kiếm:", error);
  }

  return results;
}

// Xóa dữ liệu cũ
function clearOldData() {
  chrome.storage.local.set({ crawledData: [] }, function () {
    console.log("Đã xóa dữ liệu cũ");
    // Thông báo cập nhật count
    chrome.runtime.sendMessage({ action: "updateCount" });
  });
}

// Lưu dữ liệu vào storage
function savePlaceData(placeData) {
  if (!chrome.runtime?.id || typeof chrome.runtime?.id !== "string") return;

  try {
    chrome.storage.local.get(["crawledData"], function (result) {
      try {
        const existingData = result.crawledData || [];
        // Kiểm tra xem đã có dữ liệu này chưa
        const isDuplicate = existingData.some(
          (item) =>
            item.name === placeData.name && item.address === placeData.address
        );
        if (!isDuplicate) {
          existingData.push(placeData);
          chrome.storage.local.set({ crawledData: existingData }, function () {
            if (chrome.runtime.lastError) {
              if (
                chrome.runtime.lastError.message &&
                chrome.runtime.lastError.message.includes(
                  "Extension context invalidated"
                )
              ) {
                console.error(
                  "Extension context invalidated. Dừng crawl và giữ nguyên dữ liệu."
                );
                stopCrawling();
                chrome.storage.local.set({ resumeNeeded: true }, function () {
                  chrome.runtime.sendMessage({ action: "showResumeCrawl" });
                });
                alert(
                  'Extension bị reload hoặc trang bị làm mới. Dữ liệu đã crawl vẫn được giữ lại. Bấm "Tiếp tục Crawl" để tiếp tục!'
                );
              } else {
                console.error(
                  "Lỗi khi lưu dữ liệu:",
                  chrome.runtime.lastError.message
                );
              }
            }
          });
        }
      } catch (error) {
        if (
          error.message &&
          error.message.includes("Extension context invalidated")
        ) {
          console.error(
            "Extension context invalidated. Dừng crawl và giữ nguyên dữ liệu."
          );
          stopCrawling();
          chrome.storage.local.set({ resumeNeeded: true }, function () {
            chrome.runtime.sendMessage({ action: "showResumeCrawl" });
          });
          alert(
            'Extension bị reload hoặc trang bị làm mới. Dữ liệu đã crawl vẫn được giữ lại. Bấm "Tiếp tục Crawl" để tiếp tục!'
          );
        } else {
          console.error("Lỗi khi lưu dữ liệu:", error);
        }
      }
    });
  } catch (error) {
    if (
      error.message &&
      error.message.includes("Extension context invalidated")
    ) {
      console.error(
        "Extension context invalidated. Dừng crawl và giữ nguyên dữ liệu."
      );
      stopCrawling();
      chrome.storage.local.set({ resumeNeeded: true }, function () {
        chrome.runtime.sendMessage({ action: "showResumeCrawl" });
      });
      alert(
        'Extension bị reload hoặc trang bị làm mới. Dữ liệu đã crawl vẫn được giữ lại. Bấm "Tiếp tục Crawl" để tiếp tục!'
      );
    } else {
      console.error("Lỗi khi lưu dữ liệu:", error);
    }
  }
}

// Khởi tạo khi trang load xong
document.addEventListener("DOMContentLoaded", function () {
  console.log("Google Maps Crawler đã sẵn sàng");
});

// Lắng nghe thay đổi URL để crawl dữ liệu mới
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    if (isCrawling) {
      setTimeout(crawlData, 1000); // Crawl sau 1 giây khi URL thay đổi
    }
  }
}, 1000);
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (request.action === "startCrawl") {
      crawlLimit = request.limit || 0;
      startCrawling();
      sendResponse({ success: true });
    } else if (request.action === "stopCrawl") {
      stopCrawling();
      sendResponse({ success: true });
    } else if (request.action === "getAutoClickInfo") {
      sendResponse({
        success: true,
        isAutoClicking: isAutoClicking,
        isAutoScrolling: isAutoScrolling,
        currentIndex: currentItemIndex,
        totalItems: searchResults.length,
      });
    } else if (request.action === "resumeCrawl") {
      console.log("🔄 Tiếp tục crawl sau khi reload...");
      isCrawling = false;
      startCrawling();
      sendResponse({ success: true });
    } else if (request.action === "searchKeyword") {
      const input = document.getElementById("searchboxinput");
      const searchBtn = document.getElementById("searchbox-searchbutton");

      if (!input || !searchBtn) {
        console.warn("❌ Không tìm thấy thanh tìm kiếm.");
        alert("Không tìm thấy thanh tìm kiếm trên Google Maps.");
        sendResponse({ success: false });
        return;
      }

      // Nhập từ khóa
      input.focus();
      input.value = request.keyword;

      // Trigger sự kiện input để Maps nhận
      input.dispatchEvent(new Event("input", { bubbles: true }));

      // Đợi chút rồi click nút tìm kiếm
      setTimeout(() => {
        searchBtn.click();
        console.log("🔍 Đã tìm kiếm:", request.keyword);

        // Đợi Maps load kết quả rồi mới crawl
        setTimeout(() => {
          startCrawling();
        }, 3000);

        sendResponse({ success: true });
      }, 300);
    }
  } catch (error) {
    console.error("❌ Lỗi khi xử lý message:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});
