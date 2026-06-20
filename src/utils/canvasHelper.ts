/**
 * Helper utility to draw the certificate on a canvas and trigger a download.
 */

export interface DrawingOptions {
  imageUrl: string;
  userName: string;
  certId: string;
  certDate: string;
  
  // Name styling and placement (in canvas pixels: 0 to 5000 for width, 0 to 3535 for height)
  nameX: number;
  nameY: number;
  nameFontSize: number;
  nameColor: string;
  nameFontFamily: string; // 'GlacialIndifference' or 'Italianno' or sans-serif
  nameFontWeight: string; // 'normal' or 'bold'

  // ID styling and placement
  idX: number;
  idY: number;
  idFontSize: number;
  idColor: string;
  idFontFamily: string;
  idFontWeight: string;

  // Date styling and placement
  dateX: number;
  dateY: number;
  dateFontSize: number;
  dateColor: string;
  dateFontFamily: string;
  dateFontWeight: string;
}

/**
 * Loads an image from a URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS if needed
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${src}. Error: ${err}`));
  });
}

/**
 * Ensures a custom font is loaded and registered in the document.
 */
async function ensureFontLoaded(family: string, url: string): Promise<void> {
  try {
    // Check if font is already loaded
    const isLoaded = document.fonts.check(`12px "${family}"`);
    if (isLoaded) return;

    const fontFace = new FontFace(family, `url(${url})`);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
  } catch (error) {
    console.error(`Error loading font "${family}" from "${url}":`, error);
  }
}

/**
 * Generates the certificate as a data URL.
 */
export async function generateCertificateDataUrl(
  canvas: HTMLCanvasElement,
  options: DrawingOptions
): Promise<string> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // 1. Ensure fonts are loaded
  await Promise.all([
    ensureFontLoaded('GlacialIndifference', '/assets/fonts/GlacialIndifference-Regular.otf'),
    ensureFontLoaded('GlacialIndifferenceBold', '/assets/fonts/GlacialIndifference-Bold.otf'),
    ensureFontLoaded('Italianno', '/assets/fonts/Italianno-Regular.ttf'),
  ]);

  // 2. Load background image template
  const background = await loadImage(options.imageUrl);

  // Set canvas dimensions to match the high-resolution template (5000 x 3535)
  canvas.width = background.width;
  canvas.height = background.height;

  // 3. Draw background
  ctx.drawImage(background, 0, 0);

  // 4. Draw Name
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = options.nameColor;
  
  // Map font family
  let nameFontName = options.nameFontFamily;
  if (options.nameFontFamily === 'GlacialIndifference' && options.nameFontWeight === 'bold') {
    nameFontName = 'GlacialIndifferenceBold';
  }
  
  // Dynamic scaling based on 5000x3535 reference system
  const scaleX = canvas.width / 5000;
  const scaleY = canvas.height / 3535;
  const fontScale = canvas.width / 5000;
  
  const finalNameX = options.nameX * scaleX;
  const finalNameY = options.nameY * scaleY;
  const finalNameFontSize = options.nameFontSize * fontScale;

  ctx.font = `${options.nameFontWeight} ${finalNameFontSize}px "${nameFontName}", sans-serif`;
  ctx.fillText(options.userName, finalNameX, finalNameY);
  ctx.restore();

  // 5. Draw ID
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = options.idColor;
  
  let idFontName = options.idFontFamily;
  if (options.idFontFamily === 'GlacialIndifference' && options.idFontWeight === 'bold') {
    idFontName = 'GlacialIndifferenceBold';
  }
  
  const finalIdX = options.idX * scaleX;
  const finalIdY = options.idY * scaleY;
  const finalIdFontSize = options.idFontSize * fontScale;

  ctx.font = `${options.idFontWeight} ${finalIdFontSize}px "${idFontName}", monospace`;
  ctx.fillText(options.certId, finalIdX, finalIdY);
  ctx.restore();

  // 6. Draw Date
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = options.dateColor;
  
  let dateFontName = options.dateFontFamily;
  if (options.dateFontFamily === 'GlacialIndifference' && options.dateFontWeight === 'bold') {
    dateFontName = 'GlacialIndifferenceBold';
  }
  
  const finalDateX = options.dateX * scaleX;
  const finalDateY = options.dateY * scaleY;
  const finalDateFontSize = options.dateFontSize * fontScale;

  ctx.font = `${options.dateFontWeight} ${finalDateFontSize}px "${dateFontName}", sans-serif`;
  ctx.fillText(options.certDate, finalDateX, finalDateY);
  ctx.restore();

  // Return the high-res PNG data URL
  return canvas.toDataURL('image/png');
}

/**
 * Triggers the browser download of the certificate.
 */
export function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
