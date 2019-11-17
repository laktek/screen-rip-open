import puppeteer = require('puppeteer');
import devices = require('puppeteer/DeviceDescriptors');

import { Page, Base64ScreenShotOptions } from 'puppeteer';

export const UAString = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3494.0 Safari/537.36 (ScreenripBot/0.2; +https://www.screen.rip)';

export class InvalidDevice extends Error {}
export class InvalidClip extends Error {};

const second = 1000;

export default async function renderScreenshot(url: string, opts: any={}) {
  var data, context, page;

  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--mute-audio",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-browser-side-navigation",
        "--disable-client-side-phishing-detection",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-hang-monitor",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--enable-automation",
        "--password-store=basic",
        "--use-mock-keychain"
      ],
      timeout: 30 * second,
    });
    if (!browser) {
      throw 'chrome: could not launch a browser instance';
    }

    context = await browser.createIncognitoBrowserContext();
    if (!context) {
      throw 'chrome: could not get a browser context';
    }

    page = await context.newPage();
    if (!page) {
      throw 'chrome: could not create a new page'
    }

    await page.setRequestInterception(true);

    page.on('request', req => {
      const overrides: any = {};
      if (req.url() === url) {
        overrides['method'] = opts['method'] || "GET";
      }
      overrides['headers'] = opts['headers'] || {};
      overrides['postData'] = opts['postData'] || '';
      req.continue(overrides);
    });

    if (opts['cookies']) {
      const cookies: any = [];
      opts['cookies'].forEach((c: any) => {
        if (!c['domain'] || !c['url']) {
          c['url'] = url;
        }
        cookies.push(c);
      });
      await page.setCookie(...cookies);
    }

    let emulation: any = null;
    if (opts['device']) {
      let device = devices[opts['device'] ]
      if (!device) {
        throw new InvalidDevice(`invalid device: ${opts['device']}`);
      }
      emulation = device;
    } else {
      const viewport = opts['viewport'] || {};
      const width = Math.min(viewport['width'] || 1024, 2048);
      const height = Math.min(viewport['height'] || 768, 1536);
      const deviceScaleFactor = viewport['deviceScaleFactor'] || 1;
      const isMobile = viewport['isMobile'] || false;
      const landscape = viewport['landscape'] || false;

      emulation = { viewport: { width, height, deviceScaleFactor, isMobile, landscape }, userAgent: UAString }
    }
    await page.emulate(emulation);

    await page.goto(url, { timeout: 0 });
    console.log(`page loaded ${url}`);

    const wait = opts['wait'];
    if (wait === 'load') {
      await page.waitForNavigation({ waitUntil: 'load' });
    } else if (typeof wait === 'string') {
      await page.waitForSelector(wait, { visible: true });
    } else if (typeof wait === 'number') {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: Math.min(wait, 180) * second });
    }

    if (opts['runJS']) {
      await page.evaluate(opts['runJS']);
    }

    data = (opts['format'] === 'pdf')
      ? await renderPDF(page, opts)
      : await renderImage(page, opts);

    if (!data || !data.length) {
      throw 'chrome: empty screenshot response'
    }
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    if (page) {
      await page.close();
    }

    if (context) {
      await context.close(), 0.5 * second;
    }

    return data;
  }
}

async function renderPDF(page: Page, opts: any) {
  const pdfOptions = opts['pdfOptions'] || {};
  delete(pdfOptions['path']);
  if (pdfOptions['screen']) {
    pdfOptions['printBackground'] = true;
    await page.emulateMedia('screen');
  }
  return await page.pdf(pdfOptions);
}

async function renderImage(page: Page, opts: { clip: any; fullPage: boolean; quality: number; format: "jpg" | "jpeg" | "png"}) {
  const types  = {
    "jpg" : "jpeg",
    "jpeg": "jpeg",
    "png": "png"
  };

  var clip;
  if (typeof opts['clip'] === 'string') {
    const el = await page.$(opts['clip']);
    if (el) {
      clip = await el.boundingBox();
    }
  } else {
    clip = opts['clip'];
  }

  if (!clip || !clip.x || !clip.y || !clip.width || !clip.height) {
    clip = null;
  }

  const screenshotOpts: Base64ScreenShotOptions = {
    type: (types[opts['format']] as "jpeg" | "png") || 'png',
    encoding: 'base64',
    fullPage: opts['fullPage'],
    clip,
  }
  if (screenshotOpts['type'] === 'jpeg') {
    screenshotOpts['quality'] = opts['quality'] || 90;
  }
  return await page.screenshot(screenshotOpts);
}
