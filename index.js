(async function () {
  const INPUT_PLACEHOLDER = 'Fill alt text & press Enter (Esc to cancel)',
    INPUT_WIDTH = 300,
    INPUT_HEIGHT = 30,
    DEFAULT_GAP = 10,
    HIGHLIGHT_IMAGE_STYLES = {
      outline: '2px solid #FF0000',
      outlineOffset: '2px',
      webkitBoxShadow: '0px 0px 0px 4px #FFFF00BF',
      mozBoxShadow: '0px 0px 0px 4px #FFFF00BF',
      boxShadow: '0px 0px 0px 4px #FFFF00BF',
    },
    INPUT_STYLES = `
      input[data-highlighted-input] {
        position: absolute !important;
        width: ${INPUT_WIDTH}px !important;
        height: ${INPUT_HEIGHT}px !important;
        font-size: 16px !important;
        background-color: #FFF !important;
        color: #000 !important;
        z-index: 999 !important;
        border: 2px solid #000 !important;
        border-radius: 4px !important;
        -webkit-box-shadow: 0px 0px 0px 5px #FFFFFF !important;
        -moz-box-shadow: 0px 0px 0px 5px #FFFFFF !important;
        box-shadow: 0px 0px 0px 5px #FFFFFF !important;
      }

      input[data-highlighted-input]:focus {
        outline: 3px solid #FF0000 !important;
    }`;

  const imgElements = document.querySelectorAll('img');

  const mutationObserver = new MutationObserver((entries) => {
    const addedImgNodes = Array.from(entries[0].addedNodes).filter(
        (item) => item.tagName === 'IMG'
      ),
      removedImgNodes = Array.from(entries[0].removedNodes).filter(
        (item) => item.tagName === 'IMG'
      );

    if (addedImgNodes.length) {
      highlightImgElementsAndUpdateAltAttr(
        addedImgNodes,
        HIGHLIGHT_IMAGE_STYLES
      );
    }

    if (removedImgNodes.length) {
      // searching for existing input (in case if its value is not saved, e.g. Enter or Esc not pressed)
      // for removed img and remove it as well
      removedImgNodes.forEach((item) => {
        const allCustomInputs = document.querySelectorAll(
          '[data-initial-alt-text]'
        );

        const searchedInput = Array.from(allCustomInputs).find(
          (input) => input.dataset.initialAltText === item.alt
        );

        if (searchedInput) {
          document.body.removeChild(searchedInput);
        }
      });
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
  });

  document.body.addEventListener('click', addAltImgInput);

  addInputFocusStyles(INPUT_STYLES);

  if (imgElements.length) {
    highlightImgElementsAndUpdateAltAttr(imgElements, HIGHLIGHT_IMAGE_STYLES);
  }

  async function fetchRandomWordsByAmount(amount) {
    if (!amount) {
      return [];
    }

    try {
      const res = await fetch(
        `https://random-word-api.herokuapp.com/word?number=${amount}`
      );

      if (res.ok) {
        return await res.json();
      }

      return [];
    } catch (error) {
      console.error('fetchWordsByAmount error: ', error);
      return [];
    }
  }

  async function highlightImgElementsAndUpdateAltAttr(elements, styles) {
    const randomWordsArr = await fetchRandomWordsByAmount(elements.length);

    for (let i = 0; i < elements.length; i += 1) {
      setElementStyle(elements[i], styles);
      elements[i].alt = randomWordsArr?.[i] ?? 'image';
    }
  }

  function setElementStyle(element, styles) {
    Object.entries(styles).map(([key, value]) => (element.style[key] = value));
  }

  function addAltImgInput(event) {
    if (
      event.target.tagName === 'IMG' &&
      event.target.dataset.hasOpenedInput !== 'true'
    ) {
      const { pageX, pageY, target } = event;
      const { top, left } = getInputElementCoords({
        pageX,
        pageY,
      });
      const inputEl = document.createElement('input');

      setElementStyle(inputEl, {
        top: `${top}px`,
        left: `${left}px`,
      });

      inputEl.placeholder = INPUT_PLACEHOLDER;
      inputEl.title = INPUT_PLACEHOLDER;
      inputEl.value = target.alt;
      inputEl.dataset.highlightedInput = true;
      inputEl.dataset.initialAltText = target.alt;
      target.dataset.hasOpenedInput = true;

      inputEl.addEventListener('keydown', keydownListener);
      document.body.appendChild(inputEl);
      inputEl.focus();

      function keydownListener(e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          if (e.key === 'Enter') {
            target.alt = e.target.value;
          }

          target.dataset.hasOpenedInput = false;
          inputEl.removeEventListener('keydown', keydownListener);
          document.body.removeChild(inputEl);
        }
      }

      function getInputElementCoords({ pageX, pageY }) {
        let top = pageY,
          left = pageX - INPUT_WIDTH / 2;
        const { clientWidth, clientHeight } = document.body;

        // adjusting the input position
        // if it's too close to document edge
        if (pageY + INPUT_HEIGHT > clientHeight) {
          top = pageY - INPUT_HEIGHT - DEFAULT_GAP;
        }

        if (pageX - INPUT_WIDTH / 2 < DEFAULT_GAP) {
          left = DEFAULT_GAP;
        } else if (pageX + INPUT_WIDTH / 2 > clientWidth) {
          left = clientWidth - INPUT_WIDTH - DEFAULT_GAP * 2;
        }

        return { top, left };
      }
    }
  }

  function addInputFocusStyles(styles) {
    const styleTag = document.createElement('style');
    const headElem = document.querySelector('head');

    styleTag.appendChild(document.createTextNode(styles));

    if (headElem) {
      headElem.appendChild(styleTag);
    }
  }
})();
