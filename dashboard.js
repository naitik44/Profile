let parsedDoc = null;
let originalHtmlString = '';
let lbData = [];

// Load the index.html file
async function loadIndex() {
  try {
    const response = await fetch('index.html');
    originalHtmlString = await response.text();

    const parser = new DOMParser();
    parsedDoc = parser.parseFromString(originalHtmlString, 'text/html');

    populateForm();
    updatePreview();
  } catch (error) {
    console.error('Error loading index.html:', error);
  }
}

// Populate the form fields with data from the parsed document
function populateForm() {
  if (!parsedDoc) return;

  // Hero Section
  const heroName = parsedDoc.querySelector('.hero-name');
  if (heroName) document.getElementById('hero-name').value = heroName.innerHTML;

  const heroSub = parsedDoc.querySelector('.hero-sub');
  if (heroSub) document.getElementById('hero-sub').value = heroSub.innerHTML;

  // About Section
  const aboutTextDiv = parsedDoc.querySelector('.about-text');
  if (aboutTextDiv) {
    const paragraphs = aboutTextDiv.querySelectorAll('p');
    if (paragraphs[0]) document.getElementById('about-p1').value = paragraphs[0].innerHTML;
    if (paragraphs[1]) document.getElementById('about-p2').value = paragraphs[1].innerHTML;
    if (paragraphs[2]) document.getElementById('about-p3').value = paragraphs[2].innerHTML;
  }

  // Experience Section (First Item)
  const firstExpItem = parsedDoc.querySelector('.exp-item');
  if (firstExpItem) {
    const company = firstExpItem.querySelector('.exp-company');
    if (company) document.getElementById('exp1-company').value = company.innerHTML;

    const role = firstExpItem.querySelector('.exp-role');
    if (role) document.getElementById('exp1-role').value = role.innerHTML;
  }

  // Portfolio / lbData
  const lbDataRegex = /const lbData = (\[.*?\]);/s;
  const match = originalHtmlString.match(lbDataRegex);
  if (match && match[1]) {
    try {
      lbData = JSON.parse(match[1]);
      renderPortfolioItems();
    } catch (e) {
      console.error("Error parsing lbData JSON:", e);
    }
  }

  attachListeners();
}

function renderPortfolioItems() {
  const container = document.getElementById('portfolio-items');
  container.innerHTML = '';

  lbData.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'array-item';

    div.innerHTML = `
      <div class="form-group" style="margin-bottom: 5px;">
        <label>Title ${index + 1}</label>
        <input type="text" class="pf-title" data-index="${index}" value="${item.title}">
      </div>
      <div class="form-group" style="margin-bottom: 5px;">
        <label>Type</label>
        <input type="text" class="pf-type" data-index="${index}" value="${item.type}">
      </div>
      <div class="form-group" style="margin-bottom: 5px;">
        <label>Image Source</label>
        <input type="text" class="pf-src" data-index="${index}" value="${item.src}">
      </div>
    `;
    container.appendChild(div);
  });
}

// Update the parsed document based on form changes
function updateParsedDoc() {
  if (!parsedDoc) return;

  // Hero Section
  const heroName = parsedDoc.querySelector('.hero-name');
  if (heroName) heroName.innerHTML = document.getElementById('hero-name').value;

  const heroSub = parsedDoc.querySelector('.hero-sub');
  if (heroSub) heroSub.innerHTML = document.getElementById('hero-sub').value;

  // About Section
  const aboutTextDiv = parsedDoc.querySelector('.about-text');
  if (aboutTextDiv) {
    const paragraphs = aboutTextDiv.querySelectorAll('p');
    if (paragraphs[0]) paragraphs[0].innerHTML = document.getElementById('about-p1').value;
    if (paragraphs[1]) paragraphs[1].innerHTML = document.getElementById('about-p2').value;
    if (paragraphs[2]) paragraphs[2].innerHTML = document.getElementById('about-p3').value;
  }

  // Experience Section
  const firstExpItem = parsedDoc.querySelector('.exp-item');
  if (firstExpItem) {
    const company = firstExpItem.querySelector('.exp-company');
    if (company) company.innerHTML = document.getElementById('exp1-company').value;

    const role = firstExpItem.querySelector('.exp-role');
    if (role) role.innerHTML = document.getElementById('exp1-role').value;
  }

  // Update Portfolio lbData
  document.querySelectorAll('.pf-title').forEach(input => {
    lbData[input.dataset.index].title = input.value;
  });
  document.querySelectorAll('.pf-type').forEach(input => {
    lbData[input.dataset.index].type = input.value;
  });
  document.querySelectorAll('.pf-src').forEach(input => {
    lbData[input.dataset.index].src = input.value;
  });

  // Re-serialize the document to a string
  let updatedHtmlString = '<!DOCTYPE html>\n' + parsedDoc.documentElement.outerHTML;

  // Replace lbData in the string
  const lbDataRegex = /const lbData = \[.*?\];/s;
  const newLbDataString = `const lbData = ${JSON.stringify(lbData)};`;
  updatedHtmlString = updatedHtmlString.replace(lbDataRegex, newLbDataString);

  return updatedHtmlString;
}

// Update the iframe preview
function updatePreview() {
  const updatedHtmlString = updateParsedDoc();
  if (updatedHtmlString) {
      const blob = new Blob([updatedHtmlString], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const iframe = document.getElementById('preview-iframe');

      // Cleanup previous blob url to avoid memory leaks
      if (iframe.src && iframe.src.startsWith('blob:')) {
          URL.revokeObjectURL(iframe.src);
      }

      iframe.src = url;
  }
}

// Attach event listeners to all form inputs
function attachListeners() {
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      updatePreview();
    });
  });

  // Attach to dynamic portfolio inputs
  const pfContainer = document.getElementById('portfolio-items');
  pfContainer.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
      updatePreview();
    }
  });

  document.getElementById('export-btn').addEventListener('click', exportHtml);
}

// Export the updated HTML to a file
function exportHtml() {
  const updatedHtmlString = updateParsedDoc();
  if (updatedHtmlString) {
    const blob = new Blob([updatedHtmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize
loadIndex();
