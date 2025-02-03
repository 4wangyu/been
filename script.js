Promise.all([
  Map.create(),
  new Promise((x) => window.addEventListener('DOMContentLoaded', x, false)),
]).then(onMapLoaded);

async function onMapLoaded([map]) {
  const $ = document.querySelector.bind(document);
  // Append map to DOM.
  const container = $('.map');
  container.appendChild(map.element);

  // Build sidebar.
  const countrylist = $('.countrylist');
  for (const region of map.regions) {
    const visitedCountries = region.countries.filter(
      (country) => country.visited
    ).length;
    const regionElement = document.createElement('div');
    regionElement.classList.add('region');
    regionElement.innerHTML = `
      <div class=region-title>
        <h3>${region.name}</h3><span>${visitedCountries}/${region.countries.length}</span>
      </div>
    `;

    countrylist.appendChild(regionElement);
    for (const country of region.countries)
      regionElement.appendChild(country.sidebarElement);
  }

  // Update title
  const countries = map.regions.reduce(
    (all, region) => [...all, ...region.countries],
    []
  );
  const totalVisited = countries.filter((c) => c.visited).length;
  $('header h3').textContent = `Visited: ${totalVisited}/${countries.length}`;

  // Hover countries when hovering over
  countrylist.addEventListener('mousemove', hoverCountry, false);
  countrylist.addEventListener('mouseleave', hoverCountry, false);
  map.element.addEventListener('mousemove', hoverCountry, false);
  map.element.addEventListener('mouseleave', hoverCountry, false);

  // Reveal country when clicking
  map.element.addEventListener('click', revealCountry, false);
  map.element.addEventListener('tap', revealCountry, false);
  countrylist.addEventListener('click', revealCountry, false);
  countrylist.addEventListener('tap', revealCountry, false);

  function hoverCountry(event) {
    let target = event.target;
    let country = null;
    while (target && !(country = target[Country.Symbol]))
      target = target.parentElement;
    setHoveredCountry(country);
    event.stopPropagation();
    event.preventDefault();
  }

  function revealCountry(event) {
    let target = event.target;
    let country = null;
    while (target && !(country = target[Country.Symbol]))
      target = target.parentElement;
    if (country === revealedCountry) country = null;
    setRevealedCountry(country);
    event.stopPropagation();
    event.preventDefault();
  }

  let revealedCountry = null;
  function setRevealedCountry(country) {
    if (revealedCountry) {
      revealedCountry.mapElement.classList.remove('revealing');
      revealedCountry.sidebarElement.classList.remove('revealing');
    }
    revealedCountry = country;
    if (revealedCountry) {
      revealedCountry.mapElement.classList.add('revealing');
      revealedCountry.sidebarElement.classList.add('revealing');
      scrollIntoViewIfNeeded(revealedCountry.sidebarElement);
      map.zoomIntoCountry(revealedCountry);
    } else {
      setHoveredCountry(null);
      map.resetZoom();
    }
  }

  let hoveredCountry = null;
  function setHoveredCountry(country) {
    if (hoveredCountry) {
      hoveredCountry.mapElement.classList.remove('hovered');
      hoveredCountry.sidebarElement.classList.remove('hovered');
    }
    hoveredCountry = country;
    if (hoveredCountry) {
      hoveredCountry.mapElement.classList.add('hovered');
      hoveredCountry.sidebarElement.classList.add('hovered');
    }
  }
}

// Taken from https://gist.github.com/hsablonniere/2581101
function scrollIntoViewIfNeeded(element, centerIfNeeded = true) {
  if (element.scrollIntoViewIfNeeded) {
    element.scrollIntoViewIfNeeded(true);
    return;
  }

  var parent = element.parentNode,
    parentComputedStyle = window.getComputedStyle(parent, null),
    parentBorderTopWidth = parseInt(
      parentComputedStyle.getPropertyValue('border-top-width')
    ),
    parentBorderLeftWidth = parseInt(
      parentComputedStyle.getPropertyValue('border-left-width')
    ),
    overTop = element.offsetTop - parent.offsetTop < parent.scrollTop,
    overBottom =
      element.offsetTop -
        parent.offsetTop +
        element.clientHeight -
        parentBorderTopWidth >
      parent.scrollTop + parent.clientHeight,
    overLeft = element.offsetLeft - parent.offsetLeft < parent.scrollLeft,
    overRight =
      element.offsetLeft -
        parent.offsetLeft +
        element.clientWidth -
        parentBorderLeftWidth >
      parent.scrollLeft + parent.clientWidth,
    alignWithTop = overTop && !overBottom;

  if ((overTop || overBottom) && centerIfNeeded) {
    parent.scrollTop =
      element.offsetTop -
      parent.offsetTop -
      parent.clientHeight / 2 -
      parentBorderTopWidth +
      element.clientHeight / 2;
  }

  if ((overLeft || overRight) && centerIfNeeded) {
    parent.scrollLeft =
      element.offsetLeft -
      parent.offsetLeft -
      parent.clientWidth / 2 -
      parentBorderLeftWidth +
      element.clientWidth / 2;
  }

  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    element.scrollIntoView(alignWithTop);
  }
}
