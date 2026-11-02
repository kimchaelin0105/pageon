(() => {
  const popup = document.querySelector("#signature-menu-popup");
  const openButton = document.querySelector(".signature-menu-button");
  if (!popup || !openButton) return;

  // 메뉴 설명과 가격은 아래 데이터에서 수정할 수 있어요.
  const menus = [
    {
      name: "Cat Cookie",
      image: "assets/imges/main/menu1.png",
      alt: "접시에 담긴 고양이 초코 쿠키",
      description: ["바삭한 초코 쿠키에", "Page On의 고양이 얼굴을 담은", "시그니처 디저트예요."],
      tags: ["Chocolate", "Crispy", "Sweet"],
      price: 4600,
      pairing: "Americano"
    },
    {
      name: "Choco Latte",
      image: "assets/imges/main/menu2.png",
      alt: "초콜릿 토핑을 올린 따뜻한 초코 라떼",
      description: ["진한 초콜릿과 부드러운 우유가", "어우러져 달콤한 휴식을 전하는", "따뜻한 초코 라떼예요."],
      tags: ["Chocolate", "Creamy", "Warm"],
      price: 4500,
      pairing: "Cat Cookie"
    },
    {
      name: "Smore Cookie",
      image: "assets/imges/main/menu3.png",
      alt: "초콜릿과 마시멜로가 들어간 스모어 쿠키",
      description: ["초콜릿과 마시멜로의 달콤함을", "한 입에 즐길 수 있는", "부드러운 스모어 쿠키예요."],
      tags: ["Chocolate", "Marshmallow", "Soft"],
      price: 3500,
      pairing: "Cappuccino"
    },
    {
      name: "Cappuccino",
      image: "assets/imges/main/menu4.png",
      alt: "라테 아트가 그려진 카푸치노",
      description: ["깊은 커피 향 위로", "폭신한 우유 거품을 더해", "여유롭게 즐기는 카푸치노예요."],
      tags: ["Espresso", "Milk", "Foam"],
      price: 2500,
      pairing: "Smore Cookie"
    }
  ];

  const image = popup.querySelector(".signature-popup-image");
  const title = popup.querySelector(".signature-popup-title");
  const description = popup.querySelector(".signature-popup-description");
  const tags = popup.querySelector(".signature-popup-tags");
  const price = popup.querySelector(".signature-popup-price-value");
  const pairing = popup.querySelector(".signature-popup-pairing-name");
  const selectors = popup.querySelectorAll("[data-menu-index]");
  const formatter = new Intl.NumberFormat("en-US");
  let currentIndex = 0;
  let previousBodyPadding = "";

  function showMenu(index) {
    currentIndex = (index + menus.length) % menus.length;
    const menu = menus[currentIndex];

    image.src = menu.image;
    image.alt = menu.alt;
    title.textContent = menu.name;
    description.replaceChildren();
    menu.description.forEach((line, lineIndex) => {
      if (lineIndex > 0) description.append(document.createElement("br"));
      description.append(document.createTextNode(line));
    });
    tags.replaceChildren(...menu.tags.map(tag => {
      const item = document.createElement("li");
      item.textContent = tag;
      return item;
    }));
    price.textContent = formatter.format(menu.price);
    pairing.textContent = menu.pairing;
    selectors.forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.menuIndex) === currentIndex));
    });
  }

  openButton.addEventListener("click", () => {
    if (popup.open) return;
    // 배경 스크롤과 스크롤바 너비 차이로 인한 페이지 이동 방지
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    previousBodyPadding = document.body.style.paddingRight;
    const bodyPadding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;
    document.body.classList.add("signature-popup-open");
    popup.showModal();
  });

  popup.addEventListener("close", () => {
    document.body.classList.remove("signature-popup-open");
    document.body.style.paddingRight = previousBodyPadding;
    openButton.focus({ preventScroll: true });
  });

  selectors.forEach(button => {
    button.addEventListener("click", () => showMenu(Number(button.dataset.menuIndex)));
  });

  popup.querySelectorAll("[data-menu-direction]").forEach(button => {
    button.addEventListener("click", () => {
      showMenu(currentIndex + (button.dataset.menuDirection === "next" ? 1 : -1));
    });
  });

  popup.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      showMenu(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });

  // 팝업 바깥의 어두운 배경을 누르면 닫기. Esc는 dialog의 기본 동작 사용.
  let pointerStartedOutside = false;
  const isOutside = event => {
    const bounds = popup.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  popup.addEventListener("pointerdown", event => {
    pointerStartedOutside = event.target === popup && isOutside(event);
  });
  popup.addEventListener("click", event => {
    if (pointerStartedOutside && event.target === popup && isOutside(event)) popup.close();
    pointerStartedOutside = false;
  });
})();
