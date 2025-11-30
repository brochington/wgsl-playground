// URL parameter management
export function getURLParams() {
  return new URLSearchParams(window.location.search);
}

export function updateURL(shaderName = null, mode = null) {
  const params = new URLSearchParams();
  if (mode) {
    params.set('mode', mode);
  }
  if (shaderName) {
    params.set('shader', shaderName);
  }
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newURL);
}

export function getInitialStateFromURL() {
  const urlParams = getURLParams();
  const mode = urlParams.get('mode') || 'triangle';
  const shader = urlParams.get('shader');

  return {
    mode: mode,
    shader: shader
  };
}
