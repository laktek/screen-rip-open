import urlib = require('url');

// @ts-ignore: next-line
import mime = require('mime/lite');

import { default as renderScreenshot, InvalidDevice, InvalidClip } from './screenshot';

export const capture = async (req: any, res: any) => {
  // set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization');
  res.header('Access-Control-Max-Age', '1728000');

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  const url = req.query.url || req.body.url;
  if (!url) {
    res.status(400).json({ error: 'provide a url to take the screenshot' });
    return;
  }
  const parsed = urlib.parse(url);
  if (!parsed.protocol || (['http:', 'https:'].indexOf(parsed.protocol) === -1)) {
    res.status(400).json({ error: 'invalid URL' });
    return;
  }

  const opts: any = {};

  if (req.body) {
    if (validString(req.body.device)) {
      opts['device'] = req.body.device;
    }

    if (req.body.viewport) {
      opts['viewport'] = req.body.viewport;
    }

    opts['format'] = 'png';
    if (validString(req.body.format)) {
      opts['format'] = req.body.format;
    }

    if (req.body.quality) {
      opts['quality'] = parseInt(req.body.quality, 10);
    }

    if (req.body.fullpage) {
      opts['fullPage'] = isTruish(req.body.fullpage);
    }

    if (validString(req.body.method)) {
      opts['method'] = req.body.method;
    }

    if (req.body.headers) {
      opts['headers'] = req.body.headers;
    }

    const postData = req.body.postData || req.body.formData;
    if (validString(postData)) {
      opts['postData'] = postData;
    }

    if (req.body.cookies && Array.isArray(req.body.cookies)) {
      opts['cookies'] = req.body.cookies;
    }

    const wait = req.body.wait;
    if (wait) {
      opts['wait'] = wait;
    }

    const runjs = req.body.runjs;
    if (validString(runjs)) {
      opts['runJS'] = runjs;
    }

    const clip = req.body.clip;
    if (validString(clip)) {
      opts['clip'] = clip;
    }

    opts['pdfOptions'] = req.body.pdf;
  }

  try {
    const data = await renderScreenshot(url, opts);
    const mimeType = mime.getType(opts['format'] ? opts['format'] : 'png');

    res.set('Content-Type', mimeType);
    if (opts['format'] === 'pdf') {
      const filename = opts['pdfOptions']['filename'] || 'page.pdf';
      res.set('Content-Disposition', `Content-Disposition: attachment; filename="${filename}"`);
    }
    res.status(200).send(Buffer.from(data as string, 'base64'));
  } catch (error) {
    console.error(error);
    if (error instanceof InvalidDevice) {
      res.status(400).json({ error: 'invalid device setting' });
      return;
    }
    if (error instanceof InvalidClip) {
      res.status(400).json({ error: 'invalid clip (provide a valid region in page)' });
      return;
    }
    res.status(500).json({ error: 'failed to render screenshot' });
    return;
  }
}

function isTruish(value: any) {
  if (value === undefined || value === null) {
    return false;
  }

  if (value === true || value === '1' || value === 't' || value === 'true' || value === 'on' || value === 'yes') {
    return true;
  }

  return false;
}

function validString(value: string) {
  return value && value.length;
}
