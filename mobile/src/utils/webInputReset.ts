const STYLE_ID = 'mobile-web-input-reset';

export function installWebInputReset() {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    input,
    textarea {
      outline: none !important;
      box-shadow: none !important;
    }

    input:focus,
    textarea:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus {
      -webkit-text-fill-color: inherit !important;
      caret-color: auto !important;
      box-shadow: 0 0 0px 1000px transparent inset !important;
      -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
      outline: none !important;
      border: none !important;
    }
  `;

  document.head.appendChild(style);
}
