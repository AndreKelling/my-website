const Fetcher = (() => {
  const Current = require("./current.js")

  const siteUrl = `${window.location.protocol}//${top.location.host.toString()}`
  const siteMain = document.getElementById("main")
  const historyArr = []
  const transitionClass = "fader"
  const spinnerHtml = '<div class="spinner"></div>'
  const animationClass = "active"
  const animationTargetClass = "overview__link"
  const animationTime = 500
  const linkSelector = `a[href^='${siteUrl}'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']`
  let lastURL

  const init = () => {
    historyArr.push(window.location.href)

    _addInternalLinksListener(document)

    window.addEventListener("popstate", () => {
      historyArr.pop()
      lastURL = historyArr[historyArr.length - 1]

      if (historyArr.length >= 1) {
        _fetch(lastURL)
      } else {
        history.back()
      }
    })

    // add loading spinner once
    siteMain.insertAdjacentHTML("afterend", spinnerHtml)
  }

  const _addInternalLinksListener = (el) => {
    const internalLinks = el.querySelectorAll(linkSelector)

    for (const internalLink of internalLinks) {
      internalLink.addEventListener("click", (e) => {
        e.preventDefault()

        const url = siteUrl + internalLink.getAttribute("href")

        // @todo: put animation stuff into external module?
        if (internalLink.classList.contains(animationTargetClass)) {
          internalLink.classList.add(animationClass)
          setTimeout(() => {
            _clickFetch(url)
          }, animationTime)
          return
        }

        _clickFetch(url)
      })
    }
  }

  const _reinitMain = (main) => {
    _addInternalLinksListener(main)

    siteMain.classList.remove(transitionClass)
  }

  const _clickFetch = (url) => {
    if (url === window.location.href) {
      return
    }

    _fetch(url, true)
  }

  const _fetch = (url, addHistory) => {
    siteMain.classList.add(transitionClass)

    fetch(url)
      .then((dataWrappedByPromise) => dataWrappedByPromise.text())
      .then((data) => {
        if (addHistory) {
          historyArr.push(url)
        }
        history.pushState(null, null, url)

        // @todo: error when getContent results in catch here! even if not offline issue
        _getContent(data, url)
      })
      .catch((error) => {
        const offlineUrl = `${siteUrl}/404/`
        window.location.replace(offlineUrl)
        console.error("Error:", error)
      })
  }

  const _getContent = (html, url) => {
    const parser = new DOMParser()
    const content = parser.parseFromString(html, "text/html")
    const newMain = content.querySelector("#main").innerHTML
    const newTitle = content.querySelector("title").innerHTML

    Current.menu()

    Current.toggleHomeCss(newMain.includes("js-home"))

    siteMain.innerHTML = ""
    siteMain.insertAdjacentHTML("afterbegin", newMain)
    document.querySelector("title").innerHTML = newTitle

    _reinitMain(siteMain)
  }

  return {
    init
  }
})()
Fetcher.init()
