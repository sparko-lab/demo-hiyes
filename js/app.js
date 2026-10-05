/**
 * Sparko × 海悅廣告 | Architectural Poetics & Spatial Distinction
 * High-performance GSAP Observer transitions, AutoSplit Manifesto, Curve Swipe & Cinematic Private Booking Modal.
 */

// ============================================================
// 常數設定與按鈕預設文字（可依行銷需求自由自訂修改）
// ============================================================
const CTA_BUTTON_TEXT = "預約專屬鑑賞 / PRIVATE VIEWING";

// ============================================================
// 1. SPLITTEXT COMPONENT / POLYFILL
// 確保零依賴情況下，中英文字元與行間切割維持原生 GSAP SplitText 同等效能與結構
// ============================================================
class CustomSplitText {
  constructor(target, options = {}) {
    this.elements = gsap.utils.toArray(target);
    this.options = options;
    this.chars = [];
    this.words = [];
    this.lines = [];
    this.split();
  }

  split() {
    this.chars = [];
    this.words = [];
    this.lines = [];

    this.elements.forEach((el) => {
      if (!el._originalHTML) {
        el._originalHTML = el.innerHTML;
      }
      const rawText = el.textContent.trim();
      el.innerHTML = "";

      const lineWrapper = document.createElement("div");
      lineWrapper.className = this.options.linesClass || "clip-text";
      lineWrapper.style.display = "inline-block";
      lineWrapper.style.overflow = "hidden";
      lineWrapper.style.verticalAlign = "top";

      // 支援中英文混合切割
      const words = rawText.split(/\s+/);
      words.forEach((wordText, wIdx) => {
        const wordSpan = document.createElement("span");
        wordSpan.className = "split-word";
        wordSpan.style.display = "inline-block";
        wordSpan.style.whiteSpace = "nowrap";

        Array.from(wordText).forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.className = "split-char";
          charSpan.style.display = "inline-block";
          charSpan.style.position = "relative";
          charSpan.style.willChange = "transform, opacity";
          charSpan.textContent = char;
          wordSpan.appendChild(charSpan);
          this.chars.push(charSpan);
        });

        lineWrapper.appendChild(wordSpan);
        this.words.push(wordSpan);

        if (wIdx < words.length - 1) {
          const space = document.createElement("span");
          space.innerHTML = "&nbsp;";
          space.style.display = "inline-block";
          lineWrapper.appendChild(space);
        }
      });

      this.lines.push(lineWrapper);
      el.appendChild(lineWrapper);
    });

    return this;
  }

  revert() {
    this.elements.forEach((el) => {
      if (el._originalHTML) {
        el.innerHTML = el._originalHTML;
      }
    });
    this.chars = [];
    this.words = [];
    this.lines = [];
  }
}

const SplitEngine = typeof window.SplitText !== "undefined" ? window.SplitText : CustomSplitText;

// ============================================================
// 2. MAIN APPLICATION INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // 註冊 GSAP Observer 插件
  if (typeof Observer !== "undefined") {
    gsap.registerPlugin(Observer);
  }

  // 設定 CTA 預設文字常數
  const ctaBtnTextEl = document.getElementById("ctaBtnText");
  if (ctaBtnTextEl) {
    ctaBtnTextEl.textContent = CTA_BUTTON_TEXT;
  }

  const sections = document.querySelectorAll("section");
  const images = document.querySelectorAll(".bg");
  const outerWrappers = gsap.utils.toArray(".outer");
  const innerWrappers = gsap.utils.toArray(".inner");
  const fullscreenBtn = document.getElementById("btnFullscreen");

  // ============================================================
  // 第 3 頁：水平滾動畫廊 (Horizontal Scrolling Gallery 參考 codepen.io/GreenSock/pen/dydpJzY)
  // ============================================================
  const galleryViewport = document.getElementById("galleryViewport");
  const galleryTrack = document.getElementById("galleryTrack");
  const galleryCards = gsap.utils.toArray(".gallery-card");
  const galleryProgressFill = document.getElementById("galleryProgressFill");
  const galleryCurrentNum = document.getElementById("galleryCurrentNum");
  const btnGalleryPrev = document.getElementById("btnGalleryPrev");
  const btnGalleryNext = document.getElementById("btnGalleryNext");
  let galleryIndex = 0;
  let isGalleryAnimating = false;

  function updateGalleryUI(idx) {
    if (galleryProgressFill && galleryCards.length) {
      const pct = ((idx + 1) / galleryCards.length) * 100;
      galleryProgressFill.style.width = pct + "%";
    }
    if (galleryCurrentNum) {
      galleryCurrentNum.textContent = String(idx + 1).padStart(2, "0");
    }
    galleryCards.forEach((card, i) => {
      card.classList.toggle("is-active", i === idx);
    });
  }

  function setGalleryCard(idx, immediate = false) {
    if (!galleryCards.length || !galleryTrack) return;
    idx = gsap.utils.clamp(0, galleryCards.length - 1, idx);
    galleryIndex = idx;
    updateGalleryUI(idx);

    const firstCard = galleryCards[0];
    const targetCard = galleryCards[idx];
    const targetX = targetCard.offsetLeft - firstCard.offsetLeft;

    if (immediate) {
      gsap.set(galleryTrack, { x: -targetX });
      isGalleryAnimating = false;
    } else {
      isGalleryAnimating = true;
      gsap.to(galleryTrack, {
        x: -targetX,
        duration: 0.75,
        ease: "power2.out",
        onComplete: () => {
          isGalleryAnimating = false;
        },
      });
    }
  }

  // 畫廊控制按鈕點擊事件
  if (btnGalleryPrev) {
    btnGalleryPrev.addEventListener("click", () => {
      if (!isGalleryAnimating && galleryIndex > 0) {
        setGalleryCard(galleryIndex - 1);
      }
    });
  }

  if (btnGalleryNext) {
    btnGalleryNext.addEventListener("click", () => {
      if (!isGalleryAnimating && galleryIndex < galleryCards.length - 1) {
        setGalleryCard(galleryIndex + 1);
      }
    });
  }

  // 點擊卡片直接對焦
  galleryCards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (!isGalleryAnimating && i !== galleryIndex) {
        setGalleryCard(i);
      }
    });
  });

  // ============================================================
  // 第 4 頁：Responsive Line Splits 狀態控制 (參考 codepen.io/GreenSock/pen/GggpRoB)
  // 核心規則：Section 4 必須等所有文字都出現，才能換下一 section
  // ============================================================
  let isSection4AllTextVisible = false;
  let isSection4Animating = false;
  let isSection4Locked = false;
  let section4Timeline = null;

  const section4AllLines = gsap.utils.toArray("#section4Quote .split-line-inner");
  const quoteLineBar = document.getElementById("quoteLineBar");
  const quoteSub = document.getElementById("quoteSub");
  const section4ScrollCue = document.getElementById("section4ScrollCue");
  const cueText = document.getElementById("cueText");

  // 立即完成所有文字顯現，並開放前往下一頁
  function finishAllSection4Text() {
    if (section4Timeline && isSection4Animating) {
      section4Timeline.progress(1);
    } else {
      gsap.set(section4AllLines, { yPercent: 0, autoAlpha: 1 });
      if (quoteLineBar) gsap.set(quoteLineBar, { scaleX: 1, autoAlpha: 1 });
      if (quoteSub) gsap.set(quoteSub, { autoAlpha: 1, y: 0 });
      if (section4ScrollCue) gsap.set(section4ScrollCue, { autoAlpha: 1, y: 0 });
    }
    isSection4AllTextVisible = true;
    isSection4Animating = false;
    isSection4Locked = false;
    if (cueText) {
      cueText.textContent = "繼續滾動預約專屬鑑賞 · SCROLL FOR PRIVATE VIEWING ↓";
    }
  }

  // 點擊 cue 引導亦可推進
  if (section4ScrollCue) {
    section4ScrollCue.addEventListener("click", () => {
      if (currentIndex !== 3) return;
      if (!isSection4AllTextVisible) {
        finishAllSection4Text();
      } else {
        gotoSection(4, 1);
      }
    });
  }

  // 第 5 頁底部觸發按鈕區
  const ctaTriggerWrapper = document.querySelector(".cta-trigger-wrapper");

  // 模態視窗與 Curve Swipe 元素
  const curveContainer = document.getElementById("curveSwipeContainer");
  const curvePath = document.getElementById("curveSwipePath");
  const bookingModal = document.getElementById("privateBookingModal");
  const btnModalClose = document.getElementById("btnModalClose");
  const btnCtaBottom = document.getElementById("btnCtaBottom");
  const btnHeaderCta = document.getElementById("btnHeaderCta");
  const bookingForm = document.getElementById("bookingForm");
  const bookingFormContainer = document.getElementById("bookingFormContainer");
  const bookingSuccessBox = document.getElementById("bookingSuccessBox");
  const btnReturnHome = document.getElementById("btnReturnHome");

  if (!sections.length) return;

  // 為各具有 .section-heading 的區塊獨立建立 SplitText 映射
  const sectionSplitMap = new Map();
  sections.forEach((sec, idx) => {
    const heading = sec.querySelector(".section-heading");
    if (heading) {
      sectionSplitMap.set(
        idx,
        new SplitEngine(heading, {
          type: "chars,words,lines",
          linesClass: "clip-text",
        })
      );
    }
  });

  let currentIndex = -1;
  let animating = false;
  let isModalOpen = false;
  let isModalAnimating = false;

  // 初始化容器進出場座標
  gsap.set(outerWrappers, { yPercent: 100 });
  gsap.set(innerWrappers, { yPercent: -100 });

  // ============================================================
  // 3. 核心滑動轉場動畫 (CURTAIN WIPE TRANSITION - 不重複循環，到底停住)
  // ============================================================
  function gotoSection(index, direction) {
    if (isModalOpen) return; // 彈窗開啟時鎖定背景轉場

    // 限制在 0 至 sections.length - 1 之間（不循環滑動，滑至最後一頁即停住）
    index = gsap.utils.clamp(0, sections.length - 1, index);
    if (index === currentIndex && currentIndex !== -1) return;

    if (typeof direction === "undefined") {
      direction = index > currentIndex ? 1 : -1;
    }

    animating = true;

    const fromTop = direction === -1;
    const dFactor = fromTop ? -1 : 1;
    const tl = gsap.timeline({
      defaults: { duration: 1.25, ease: "power1.inOut" },
      onComplete: () => {
        animating = false;
      },
    });

    if (currentIndex >= 0) {
      // 舊畫面退場
      gsap.set(sections[currentIndex], { zIndex: 0 });
      tl.to(images[currentIndex], { yPercent: -15 * dFactor })
        .set(sections[currentIndex], { autoAlpha: 0 });

      const prevTag = sections[currentIndex].querySelector(".section-tag");
      if (prevTag) {
        tl.to(prevTag, { autoAlpha: 0, y: -15 * dFactor, duration: 0.4 }, 0);
      }
      const prevSub = sections[currentIndex].querySelector(".section-sub:not(.quote-sub)");
      if (prevSub) {
        tl.to(prevSub, { autoAlpha: 0, y: -15 * dFactor, duration: 0.4 }, 0);
      }

      // 如果從 Section 3 退場，隱藏水平畫廊卡片
      if (currentIndex === 2 && galleryCards.length) {
        tl.to(galleryCards, { autoAlpha: 0, y: -20 * dFactor, duration: 0.4 }, 0);
      }

      // 如果從 Section 4 退場，停止動畫並隱藏行切割文字、光線與提示
      if (currentIndex === 3) {
        if (section4Timeline) {
          section4Timeline.kill();
        }
        isSection4Animating = false;
        const lineInners = document.querySelectorAll("#section4Quote .split-line-inner");
        if (lineInners.length) {
          tl.to(
            lineInners,
            {
              yPercent: -125 * dFactor,
              autoAlpha: 0,
              duration: 0.45,
              ease: "power2.in",
            },
            0
          );
        }
        if (quoteLineBar) {
          tl.to(quoteLineBar, { scaleX: 0, autoAlpha: 0, duration: 0.3 }, 0);
        }
        if (quoteSub) {
          tl.to(quoteSub, { autoAlpha: 0, y: -15 * dFactor, duration: 0.3 }, 0);
        }
        if (section4ScrollCue) {
          tl.to(section4ScrollCue, { autoAlpha: 0, duration: 0.3 }, 0);
        }
      }

      // 如果從 Section 5 退場，隱藏 CTA 按鈕
      if (currentIndex === 4 && ctaTriggerWrapper) {
        tl.to(ctaTriggerWrapper, { autoAlpha: 0, y: -15 * dFactor, duration: 0.4 }, 0);
      }
    }

    // 新畫面進場
    gsap.set(sections[index], { autoAlpha: 1, zIndex: 1 });

    tl.fromTo(
      [outerWrappers[index], innerWrappers[index]],
      {
        yPercent: (i) => (i ? -100 * dFactor : 100 * dFactor),
      },
      {
        yPercent: 0,
      },
      0
    ).fromTo(images[index], { yPercent: 15 * dFactor }, { yPercent: 0 }, 0);

    // 標籤進場動畫
    const curTag = sections[index] ? sections[index].querySelector(".section-tag") : null;
    if (curTag) {
      tl.fromTo(
        curTag,
        { autoAlpha: 0, y: 25 * dFactor },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
        0.25
      );
    }

    // 主標題字元錯位隨機飛入動畫
    const splitHeading = sectionSplitMap.get(index);
    if (splitHeading && splitHeading.chars && splitHeading.chars.length) {
      tl.fromTo(
        splitHeading.chars,
        {
          autoAlpha: 0,
          yPercent: 150 * dFactor,
        },
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 1,
          ease: "power2",
          stagger: {
            each: 0.02,
            from: "random",
          },
        },
        0.2
      );
    }

    // 副標題進場動畫（非 Section 4 引用副標）
    const curSub = sections[index] ? sections[index].querySelector(".section-sub:not(.quote-sub)") : null;
    if (curSub) {
      tl.fromTo(
        curSub,
        { autoAlpha: 0, y: 30 * dFactor },
        { autoAlpha: 1, y: 0, duration: 0.85, ease: "power2.out" },
        0.35
      );
    }

    // ============================================================
    // 特殊頁面特效：第 3 頁 水平滾動畫廊 (Horizontal Scrolling Gallery)
    // ============================================================
    if (index === 2 && galleryCards.length) {
      // 根據進入方向定位卡片（向下滾入設為 0，向上滾入設為最後一張卡片）
      const initialGalleryIdx = dFactor === 1 ? 0 : galleryCards.length - 1;
      setGalleryCard(initialGalleryIdx, true);

      tl.fromTo(
        galleryCards,
        {
          y: 40 * dFactor,
          autoAlpha: 0,
          scale: 0.95,
        },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.85,
          ease: "power2.out",
          stagger: 0.08,
        },
        0.35
      );
    }

    // ============================================================
    // 特殊頁面特效：第 4 頁 Responsive Line Splits on Scroll (參考 codepen.io/GreenSock/pen/GggpRoB)
    // 規則：Section 4 必須等所有文字都出現，才能換下一 section
    // ============================================================
    if (index === 3) {
      if (dFactor === 1) {
        // 從 Section 3 向下滾入：啟動全文字行切割流暢展開
        isSection4AllTextVisible = false;
        isSection4Animating = true;
        isSection4Locked = true;
        if (cueText) {
          cueText.textContent = "文字展開中 · REVEALING...";
        }

        // 初始狀態藏於遮罩下方
        gsap.set(section4AllLines, { yPercent: 125, autoAlpha: 0 });
        if (quoteLineBar) gsap.set(quoteLineBar, { scaleX: 0, autoAlpha: 0 });
        if (quoteSub) gsap.set(quoteSub, { autoAlpha: 0, y: 15 });
        if (section4ScrollCue) gsap.set(section4ScrollCue, { autoAlpha: 0, y: 15 });

        // 伴隨帷幕推開同步啟動文字躍升
        if (section4Timeline) section4Timeline.kill();
        section4Timeline = gsap.timeline({
          delay: 0.15,
          onComplete: () => {
            isSection4AllTextVisible = true;
            isSection4Animating = false;
            if (cueText) {
              cueText.textContent = "繼續滾動預約專屬鑑賞 · SCROLL FOR PRIVATE VIEWING ↓";
            }
            // 吸收滾動慣性緩衝 400ms，確保文字完整呈現後才接受下次滑動
            setTimeout(() => {
              isSection4Locked = false;
            }, 400);
          },
        });

        // 三行核心箴言依序躍升
        section4Timeline.to(
          section4AllLines,
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.85,
            stagger: 0.22,
            ease: "power3.out",
          },
          0
        );

        // 金色呼吸分割線自中心延伸
        if (quoteLineBar) {
          section4Timeline.to(
            quoteLineBar,
            {
              scaleX: 1,
              autoAlpha: 1,
              duration: 0.55,
              ease: "power2.out",
            },
            0.65
          );
        }

        // 英文副標淡入
        if (quoteSub) {
          section4Timeline.to(
            quoteSub,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
            },
            0.8
          );
        }

        // 引導指示徽章浮現
        if (section4ScrollCue) {
          section4Timeline.to(
            section4ScrollCue,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.45,
              ease: "power2.out",
            },
            0.95
          );
        }
      } else {
        // 從 Section 5 向上回退進入：所有文字直接呈現
        isSection4AllTextVisible = true;
        isSection4Animating = false;
        isSection4Locked = false;
        if (cueText) {
          cueText.textContent = "繼續滾動預約專屬鑑賞 · SCROLL FOR PRIVATE VIEWING ↓";
        }

        tl.fromTo(
          section4AllLines,
          {
            yPercent: -125,
            autoAlpha: 0,
          },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.85,
            stagger: 0.08,
            ease: "power3.out",
          },
          0.08
        );

        if (quoteLineBar) {
          tl.fromTo(
            quoteLineBar,
            { scaleX: 0, autoAlpha: 0 },
            { scaleX: 1, autoAlpha: 1, duration: 0.5, ease: "power2.out" },
            0.3
          );
        }

        if (quoteSub) {
          tl.fromTo(
            quoteSub,
            { autoAlpha: 0, y: -15 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            0.4
          );
        }

        if (section4ScrollCue) {
          tl.fromTo(
            section4ScrollCue,
            { autoAlpha: 0, y: -10 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            0.45
          );
        }
      }
    }

    // ============================================================
    // 特殊頁面特效：第 5 頁底部尊榮預約 CTA 按鈕浮現
    // ============================================================
    if (index === 4 && ctaTriggerWrapper) {
      tl.fromTo(
        ctaTriggerWrapper,
        {
          autoAlpha: 0,
          y: 40 * dFactor,
          scale: 0.95,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.4)",
        },
        0.5
      );
    }

    currentIndex = index;
  }

  // ============================================================
  // 4. CURVE SWIPE 曲線展開與純白毛玻璃預約彈窗 (參考 codepen.io/GreenSock/pen/EaKpEpJ)
  // ============================================================
  function openBookingModal() {
    if (isModalAnimating || isModalOpen) return;
    isModalAnimating = true;
    isModalOpen = true;

    // 重設表單與反饋視窗狀態
    if (bookingFormContainer) bookingFormContainer.style.display = "block";
    if (bookingSuccessBox) bookingSuccessBox.style.display = "none";

    // 啟動 Curve Swipe SVG 曲線揭幕
    gsap.set(curveContainer, { visibility: "visible" });

    const curve = { baseY: 100, curveY: 100 };

    const swipeTl = gsap.timeline({
      onComplete: () => {
        // 揭開全螢幕純白毛玻璃遮罩
        bookingModal.classList.add("is-active");
        bookingModal.setAttribute("aria-hidden", "false");

        // 表單所有元素依序 stagger 展開
        const modalElements = gsap.utils.toArray([
          ".modal-brand-badge",
          ".modal-title",
          ".modal-trust-copy",
          ".form-field-group",
          ".btn-form-submit",
        ]);

        gsap.fromTo(
          modalElements,
          { autoAlpha: 0, y: 25 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: "power2.out",
            onComplete: () => {
              isModalAnimating = false;
              gsap.set(curveContainer, { visibility: "hidden" });
            },
          }
        );
      },
    });

    // 拋物線貝茲曲線動畫：頂點 (curveY) 優先急速拔升，兩側邊緣 (baseY) 隨後填滿全螢幕
    swipeTl
      .to(
        curve,
        {
          curveY: 0,
          duration: 0.8,
          ease: "power3.inOut",
          onUpdate: () => {
            curvePath.setAttribute(
              "d",
              `M 0 100 L 0 ${curve.baseY} Q 50 ${curve.curveY} 100 ${curve.baseY} L 100 100 Z`
            );
          },
        },
        0
      )
      .to(
        curve,
        {
          baseY: 0,
          duration: 0.9,
          ease: "power2.inOut",
          onUpdate: () => {
            curvePath.setAttribute(
              "d",
              `M 0 100 L 0 ${curve.baseY} Q 50 ${curve.curveY} 100 ${curve.baseY} L 100 100 Z`
            );
          },
        },
        0.08
      );
  }

  function closeBookingModal() {
    if (isModalAnimating || !isModalOpen) return;
    isModalAnimating = true;

    // 淡出彈窗內容
    gsap.to(bookingModal, {
      autoAlpha: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        bookingModal.classList.remove("is-active");
        bookingModal.setAttribute("aria-hidden", "true");
        gsap.set(bookingModal, { autoAlpha: 1 }); // 重設供下次開啟

        // Curve Swipe 往下滑落復原
        gsap.set(curveContainer, { visibility: "visible" });
        const curve = { baseY: 0, curveY: 0 };

        gsap
          .timeline({
            onComplete: () => {
              gsap.set(curveContainer, { visibility: "hidden" });
              isModalOpen = false;
              isModalAnimating = false;
            },
          })
          .to(
            curve,
            {
              curveY: 100,
              duration: 0.65,
              ease: "power3.inOut",
              onUpdate: () => {
                curvePath.setAttribute(
                  "d",
                  `M 0 100 L 0 ${curve.baseY} Q 50 ${curve.curveY} 100 ${curve.baseY} L 100 100 Z`
                );
              },
            },
            0
          )
          .to(
            curve,
            {
              baseY: 100,
              duration: 0.75,
              ease: "power2.inOut",
              onUpdate: () => {
                curvePath.setAttribute(
                  "d",
                  `M 0 100 L 0 ${curve.baseY} Q 50 ${curve.curveY} 100 ${curve.baseY} L 100 100 Z`
                );
              },
            },
            0.06
          );
      },
    });
  }

  // 綁定按鈕觸發事件
  if (btnCtaBottom) {
    btnCtaBottom.addEventListener("click", openBookingModal);
  }

  if (btnHeaderCta) {
    btnHeaderCta.addEventListener("click", openBookingModal);
  }

  if (btnModalClose) {
    btnModalClose.addEventListener("click", closeBookingModal);
  }

  if (btnReturnHome) {
    btnReturnHome.addEventListener("click", closeBookingModal);
  }

  // 表單送出處理與優雅反饋動畫
  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const guestName = document.getElementById("guestName").value.trim();
      const guestPhone = document.getElementById("guestPhone").value.trim();

      if (!guestName || !guestPhone) {
        alert("請填寫貴賓尊稱與聯絡電話，以便顧問為您致電確認。");
        return;
      }

      const submitBtn = document.getElementById("btnSubmitBooking");
      submitBtn.innerHTML = `<span>處理中 / PROCESSING...</span>`;
      submitBtn.style.opacity = "0.7";

      setTimeout(() => {
        // 產生隨機預約編號
        const randomRef = "HY-SPARKO-" + Math.floor(1000 + Math.random() * 9000);
        const refPill = document.querySelector(".booking-ref-pill");
        if (refPill) refPill.textContent = `BOOKING REF: ${randomRef}`;

        // 切換至成功畫面
        gsap.to(bookingFormContainer, {
          autoAlpha: 0,
          y: -20,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            bookingFormContainer.style.display = "none";
            bookingSuccessBox.style.display = "block";
            bookingForm.reset();
            submitBtn.innerHTML = `<span>確認送出預約 / SUBMIT INVITATION</span>`;
            submitBtn.style.opacity = "1";

            gsap.fromTo(
              bookingSuccessBox,
              { autoAlpha: 0, y: 30, scale: 0.95 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.2)" }
            );
          },
        });
      }, 700);
    });
  }

  // ============================================================
  // 5. 使用者互動監聽 (GSAP OBSERVER, TOUCH, WHEEL, KEYBOARD)
  // ============================================================
  if (typeof Observer !== "undefined") {
    Observer.create({
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      onDown: () => {
        if (animating || isModalOpen || isGalleryAnimating || isSection4Locked) return;

        // 如果在第 3 頁且畫廊尚未回退至第 1 張卡片：優先回退水平畫廊
        if (currentIndex === 2 && galleryIndex > 0) {
          setGalleryCard(galleryIndex - 1);
          return;
        }

        // 如果在第 4 頁向上滾動：回退至第 3 頁
        if (currentIndex === 3) {
          if (section4Timeline && isSection4Animating) {
            section4Timeline.kill();
          }
          gotoSection(2, -1);
          return;
        }

        if (currentIndex > 0) {
          gotoSection(currentIndex - 1, -1);
        }
      },
      onUp: () => {
        if (animating || isModalOpen || isGalleryAnimating || isSection4Locked) return;

        // 如果在第 3 頁且畫廊尚未推進至最後一張卡片：優先前進水平畫廊
        if (currentIndex === 2 && galleryIndex < galleryCards.length - 1) {
          setGalleryCard(galleryIndex + 1);
          return;
        }

        // 如果在第 4 頁：核心規則——必須等所有文字都出現，才能換下一 section！
        if (currentIndex === 3) {
          if (!isSection4AllTextVisible || isSection4Locked) {
            // 文字尚未全部出現，攔截換頁；若正在動畫中則立即完成展開供貴賓完整閱覽
            finishAllSection4Text();
            return;
          }
          // 所有文字皆已完整呈現，前往第 5 頁（預約尊榮鑑賞）
          gotoSection(4, 1);
          return;
        }

        if (currentIndex < sections.length - 1) {
          gotoSection(currentIndex + 1, 1);
        }
      },
      tolerance: 10,
      preventDefault: false, // 允許在模態彈窗內自然滾動表單
    });
  } else {
    // 滾輪備援
    let wheelTimeout;
    window.addEventListener(
      "wheel",
      (e) => {
        if (isModalOpen || animating || isGalleryAnimating || isSection4Locked) return;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (e.deltaY > 0) {
            if (currentIndex === 2 && galleryIndex < galleryCards.length - 1) {
              setGalleryCard(galleryIndex + 1);
              return;
            }
            if (currentIndex === 3) {
              if (!isSection4AllTextVisible || isSection4Locked) {
                finishAllSection4Text();
                return;
              }
              gotoSection(4, 1);
              return;
            }
            if (currentIndex < sections.length - 1) {
              gotoSection(currentIndex + 1, 1);
            }
          } else if (e.deltaY < 0) {
            if (currentIndex === 2 && galleryIndex > 0) {
              setGalleryCard(galleryIndex - 1);
              return;
            }
            if (currentIndex === 3) {
              if (section4Timeline && isSection4Animating) {
                section4Timeline.kill();
              }
              gotoSection(2, -1);
              return;
            }
            if (currentIndex > 0) {
              gotoSection(currentIndex - 1, -1);
            }
          }
        }, 30);
      },
      { passive: false }
    );
  }

  // 鍵盤導覽
  window.addEventListener("keydown", (e) => {
    if (isModalOpen) {
      if (e.key === "Escape") {
        closeBookingModal();
      }
      return;
    }

    if (animating || isGalleryAnimating || isSection4Locked) return;

    // 水平方向鍵左右滑動第 3 頁卡片
    if (e.key === "ArrowRight") {
      if (currentIndex === 2 && galleryIndex < galleryCards.length - 1) {
        setGalleryCard(galleryIndex + 1);
      }
      return;
    } else if (e.key === "ArrowLeft") {
      if (currentIndex === 2 && galleryIndex > 0) {
        setGalleryCard(galleryIndex - 1);
      }
      return;
    }

    if (["ArrowDown", "PageDown", "j", " "].includes(e.key)) {
      e.preventDefault();
      if (currentIndex === 2 && galleryIndex < galleryCards.length - 1) {
        setGalleryCard(galleryIndex + 1);
        return;
      }
      if (currentIndex === 3) {
        if (!isSection4AllTextVisible || isSection4Locked) {
          finishAllSection4Text();
          return;
        }
        gotoSection(4, 1);
        return;
      }
      if (currentIndex < sections.length - 1) {
        gotoSection(currentIndex + 1, 1);
      }
    } else if (["ArrowUp", "PageUp", "k"].includes(e.key)) {
      e.preventDefault();
      if (currentIndex === 2 && galleryIndex > 0) {
        setGalleryCard(galleryIndex - 1);
        return;
      }
      if (currentIndex === 3) {
        if (section4Timeline && isSection4Animating) {
          section4Timeline.kill();
        }
        gotoSection(2, -1);
        return;
      }
      if (currentIndex > 0) {
        gotoSection(currentIndex - 1, -1);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      if (currentIndex > 0) {
        gotoSection(0, -1);
      }
    } else if (e.key === "End") {
      e.preventDefault();
      if (currentIndex < sections.length - 1) {
        gotoSection(sections.length - 1, 1);
      }
    }
  });

  // 手勢滑動第 3 頁水平視窗
  if (galleryViewport) {
    let touchStartX = 0;
    let touchStartY = 0;

    galleryViewport.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    galleryViewport.addEventListener(
      "touchend",
      (e) => {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        // 水平滑動幅度大於垂直幅度時切換畫廊
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          if (diffX < 0 && galleryIndex < galleryCards.length - 1) {
            setGalleryCard(galleryIndex + 1);
          } else if (diffX > 0 && galleryIndex > 0) {
            setGalleryCard(galleryIndex - 1);
          }
        }
      },
      { passive: true }
    );
  }



  // 全螢幕切換功能
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const isFull = !!document.fullscreenElement;
      fullscreenBtn.innerHTML = isFull
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
    });
  }

  // 啟動首頁
  gotoSection(0, 1);
});
