export $ = document.createElement.bind document

window.isHtml = (el) =>
  el instanceof HTMLElement or (el?.nodeType is 1 and typeof el.nodeName is 'string')
