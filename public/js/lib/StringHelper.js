import MathHelper from './MathHelper.js';

export default class StringHelper {
  static pushURLState(data, replace = false) {
    if (window.history.pushState) {
      const baseUrl = window.location.href.split('?')[0];
      const currentState = window.history.state;
      const searchParams = new URLSearchParams(data);
      const urlEncoded = searchParams.toString();
      const newUrl = `${baseUrl}?${urlEncoded}`;

      // ignore if state is the same
      if (currentState) {
        const currentSearchParams = new URLSearchParams(currentState);
        const currentEncoded = currentSearchParams.toString();
        const currentUrl = `${baseUrl}?${currentEncoded}`;
        if (newUrl === currentUrl) return;
      }

      window.historyInitiated = true;
      if (replace === true) window.history.replaceState(data, '', newUrl);
      else window.history.pushState(data, '', newUrl);
    }
  }

  static queryParams() {
    const searchString = window.location.search;
    if (searchString.length <= 0) return {};
    const searchParams = new URLSearchParams(searchString.substring(1));
    const parsed = {};
    for (const [key, value] of searchParams.entries()) {
      parsed[key] = MathHelper.parseNumber(value);
    }
    return parsed;
  }
}
