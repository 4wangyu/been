class Country {
  constructor(region, id, name, element, visited) {
    this.region = region;
    this.id = id;
    this.name = name;
    this.visited = visited;
    this.mapElement = element;
    this.mapElement.classList.toggle('visited', visited);
    this.mapElement[Country.Symbol] = this;
    // Create title for country.
    const titleElement = element.ownerDocument.createElementNS(
      'http://www.w3.org/2000/svg',
      'title'
    );
    titleElement.textContent = this.name;
    this.mapElement.appendChild(titleElement);

    // Create sidebar entry.
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.classList = 'entry';
    this.sidebarElement.classList.toggle('visited', visited);
    this.sidebarElement.textContent = this.name;
    this.sidebarElement[Country.Symbol] = this;
  }
}

Country.Symbol = Symbol('country');

class Region {
  constructor(name) {
    this.name = name;
    this.countries = [];
  }
}

class Map {
  static async create() {
    const [svgText, countriesText] = await Promise.all([
      fetch('./world.svg').then((response) => response.text()),
      fetch('./been.md').then((response) => response.text()),
    ]);
    const domParser = new DOMParser();
    const parsedDocument = domParser.parseFromString(svgText, 'text/html');
    const foreignSVG = parsedDocument.querySelector('svg');
    const svg = document.importNode(foreignSVG, true);
    return new Map(svg, countriesText);
  }

  zoomIntoCountry(country) {
    const rect = country.mapElement.getBBox();
    const zoomLevel = 75;
    rect.x -= zoomLevel;
    rect.y -= zoomLevel;
    rect.width += 2 * zoomLevel;
    rect.height += 2 * zoomLevel;
    this._runZoomAnimation(`${rect.x} ${rect.y} ${rect.width} ${rect.height}`);
  }

  resetZoom() {
    this._runZoomAnimation(this._initialViewbox);
  }

  _runZoomAnimation(viewBox) {
    if (this._animation) this._animation.pause();
    this._animation = anime({
      targets: this.element,
      easing: 'easeOutCubic',
      duration: 300,
      viewBox,
    });
  }

  constructor(svg, countriesText) {
    this.regions = [];
    let region = null;
    for (let entry of countriesText.split('\n')) {
      entry = entry.trim();
      if (!entry.length) continue;
      if (entry.startsWith('# ')) {
        region = new Region(entry.substring(2).trim());
        this.regions.push(region);
      } else {
        const match = entry.match(/^-\s*\[(.*)\]\s+([A-Za-z]{2})\s+(.*)$/);
        if (!match) {
          console.error('Failed to parse line!\n  ' + entry);
          continue;
        }
        const visited = !!match[1].trim();
        const id = match[2];
        const name = match[3];
        const element = svg.querySelector('#' + id);
        const country = new Country(region, id, name, element, visited);
        region.countries.push(country);
      }
    }
    for (const region of this.regions)
      region.countries.sort((a, b) => a.name.localeCompare(b.name));
    this.element = svg;
    this._initialViewbox = this.element.getAttribute('viewBox');
  }
}
