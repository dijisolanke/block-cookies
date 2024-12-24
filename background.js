// Whitelist of domains to exempt from cookie blocking
const whitelist = [
  "github.com",
  "google.com",
  "googleapis.com",
  "gstatic.com",
  "youtube.com",
  "netflix.com",
  "vercel.com",
  "claude.ai",
];

// List of domains known to be persistent with cookies
const persistentDomains = [
  "ryanair.com",
  "https://www.ryanair.com",
  "example.com",
  "https://mail.yahoo.com",
  "mail.yahoo.com",
  "https://alpha-gpt.mail.yahoo.net",
];

// Function to check if a cookie should be removed
function shouldRemoveCookie(cookie) {
  return !whitelist.some((domain) => cookie.domain.includes(domain));
}

// Function to clear all non-whitelisted cookies
function clearAllCookies() {
  chrome.cookies.getAll({}, function (cookies) {
    for (let cookie of cookies) {
      if (shouldRemoveCookie(cookie)) {
        let url = `http${cookie.secure ? "s" : ""}://${cookie.domain}${
          cookie.path
        }`;
        chrome.cookies.remove(
          { url: url, name: cookie.name },
          function (details) {
            if (chrome.runtime.lastError) {
              console.error("Error removing cookie:", chrome.runtime.lastError);
            } else if (details) {
              console.log("Cookie removed:", details);
            }
          }
        );
      }
    }
  });
}

// Listen for changes to cookies
chrome.cookies.onChanged.addListener(function (changeInfo) {
  if (!changeInfo.removed && shouldRemoveCookie(changeInfo.cookie)) {
    console.log("New cookie detected:", changeInfo.cookie);
    const domain = changeInfo.cookie.domain;

    if (persistentDomains.some((d) => domain.includes(d))) {
      // Apply more aggressive clearing for persistent domains
      clearDomainCookies(domain);
    } else {
      // Remove the individual cookie
      let url = `http${changeInfo.cookie.secure ? "s" : ""}://${
        changeInfo.cookie.domain
      }${changeInfo.cookie.path}`;
      chrome.cookies.remove({ url: url, name: changeInfo.cookie.name });
    }
  }
});

// Function to clear all cookies for a specific domain
function clearDomainCookies(domain) {
  chrome.cookies.getAll({ domain: domain }, function (cookies) {
    for (let cookie of cookies) {
      if (shouldRemoveCookie(cookie)) {
        let url = `http${cookie.secure ? "s" : ""}://${cookie.domain}${
          cookie.path
        }`;
        chrome.cookies.remove({ url: url, name: cookie.name });
      }
    }
  });
}

// Run clearAllCookies every 5 minutes
setInterval(clearAllCookies, 5 * 60 * 1000);

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "clearCookies") {
    clearAllCookies();
    sendResponse({ status: "Cookies cleared" });
  }
});

// Optional: Add a listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function (details) {
  console.log("Extension installed or updated:", details.reason);
});

console.log("Cookie clearer extension is running");
